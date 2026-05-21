/**
 * @module agent-toolkit-tools
 */

import type { FeatureCollection } from 'geojson';
import { z } from 'zod';
import type { ToolState } from '../../types';
import { placesEntryIdHintSchema } from '../shared';
import { toolErrorSchema } from '../shared-output-schemas';

export const addByodLayerOutputSchema = z.union([
    z.object({
        byodEntryId: z
            .string()
            .describe('Id of the new BYOD entry (use with `byodEntryIDs` on analyseData / processData).'),
        label: z.string(),
        featureCount: z.number(),
        geometryTypes: z.array(z.string()).describe('Geometry types present (Point / LineString / Polygon / …).'),
        source: z
            .union([z.object({ kind: z.literal('url'), url: z.string() }), z.object({ kind: z.literal('inline') })])
            .describe('Where the data came from.'),
        shown: z.boolean().describe('Whether the entry was rendered immediately (mirrors the `show` input).'),
    }),
    toolErrorSchema,
]);

export const addByodLayerSchema = z
    .object({
        label: z
            .string()
            .describe('Human-readable label for the new entry (e.g. "Sales territories", "Customer pins 2026-Q1").'),
        url: z
            .url()
            .optional()
            .describe(
                'URL serving a GeoJSON FeatureCollection. Fetched once and stored on the entry. ' +
                    'EXCLUSIVE with `data`.',
            ),
        data: z
            .unknown()
            .optional()
            .describe(
                'Inline GeoJSON FeatureCollection (`{ type: "FeatureCollection", features: [...] }`). ' +
                    'EXCLUSIVE with `url`. Keep small — large inline payloads bloat the conversation.',
            ),
        entryId: placesEntryIdHintSchema,
        show: z
            .boolean()
            .optional()
            .describe(
                'Render the entry immediately after adding. Default: false (entry is stored but hidden — use `updateByodDisplay` to render later).',
            ),
    })
    .refine((v) => (v.url ? !v.data : !!v.data), {
        message: 'Pass EXACTLY ONE of `url` or `data`.',
    });

export const addByodLayerDescription =
    'Register a customer-owned GeoJSON layer as a new BYOD entry. Accepts either a URL (fetched once) or ' +
    'inline GeoJSON. The slice renders the entry with sensible defaults based on geometry type ' +
    '(Point → circle, Line → line, Polygon → fill). The new entry id is usable with `byodEntryIDs` on ' +
    '`analyseData` / `processData` and with `updateByodDisplay` to toggle visibility. ' +
    'For very large datasets, prefer programmatic seeding from the embedding app via `state.byod.addEntry(...)`.';

const isFeatureCollection = (value: unknown): value is FeatureCollection => {
    if (!value || typeof value !== 'object') return false;
    const v = value as { type?: unknown; features?: unknown };
    return v.type === 'FeatureCollection' && Array.isArray(v.features);
};

// Bounded-fetch policy for BYOD URL inputs. The tool runs with whatever network reach the host
// gives it (server-side: full reach; browser: subject to CORS). We don't try to enforce SSRF
// guarantees that the host can't itself — instead we make accidental abuse expensive: only
// http(s), short timeout, hard size cap.
const FETCH_TIMEOUT_MS = 15_000;
const MAX_RESPONSE_BYTES = 25 * 1024 * 1024; // 25 MB — comfortably above typical GeoJSON layers, refuses anything pathological.
const ALLOWED_PROTOCOLS = new Set(['http:', 'https:']);

const validateUrl = (raw: string): { url: URL } | { error: string } => {
    let parsed: URL;
    try {
        parsed = new URL(raw);
    } catch {
        return { error: `Invalid URL: "${raw}".` };
    }
    if (!ALLOWED_PROTOCOLS.has(parsed.protocol)) {
        return {
            error: `URL protocol "${parsed.protocol}" is not allowed. Only http: and https: are supported.`,
        };
    }
    return { url: parsed };
};

// Check the advertised Content-Length and bail before we read a single byte if the server
// honestly admits the payload is too large. Servers that lie or omit the header fall through.
const checkAdvertisedSize = (response: Response, url: URL): { error: string } | undefined => {
    const contentLength = response.headers.get('content-length');
    if (!contentLength) return undefined;
    const advertised = Number.parseInt(contentLength, 10);
    if (Number.isFinite(advertised) && advertised > MAX_RESPONSE_BYTES) {
        return {
            error: `Response too large for "${url}": advertised ${advertised} bytes (max ${MAX_RESPONSE_BYTES}).`,
        };
    }
    return undefined;
};

// Streaming-cap body reader. Pulls chunks from the response and aborts as soon as the running
// total crosses MAX_RESPONSE_BYTES, so we never page in a multi-GB payload. Falls back to a
// single `text()` read with post-hoc size check when the runtime has no streaming reader.
const readBodyBounded = async (response: Response, url: URL): Promise<{ value: string } | { error: string }> => {
    const reader = response.body?.getReader();
    if (!reader) {
        const text = await response.text();
        if (text.length > MAX_RESPONSE_BYTES) {
            return { error: `Response too large for "${url}": ${text.length} bytes (max ${MAX_RESPONSE_BYTES}).` };
        }
        return { value: text };
    }
    const chunks: Uint8Array[] = [];
    let total = 0;
    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        total += value.byteLength;
        if (total > MAX_RESPONSE_BYTES) {
            await reader.cancel();
            return {
                error: `Response exceeded ${MAX_RESPONSE_BYTES} bytes while streaming "${url}". Refusing to load.`,
            };
        }
        chunks.push(value);
    }
    const merged = new Uint8Array(total);
    let offset = 0;
    for (const chunk of chunks) {
        merged.set(chunk, offset);
        offset += chunk.byteLength;
    }
    return { value: new TextDecoder().decode(merged) };
};

// Translate AbortController-triggered aborts into a friendlier timeout message; pass everything
// else through verbatim. Pulled out so the main fetch flow doesn't carry the catch-block branch.
const wrapFetchError = (error: unknown, url: URL): { error: string } => {
    if (error instanceof Error && error.name === 'AbortError') {
        return { error: `Fetch timed out after ${FETCH_TIMEOUT_MS}ms for "${url}".` };
    }
    return { error: `Failed to fetch "${url}": ${error instanceof Error ? error.message : String(error)}` };
};

// Fetches a JSON resource with timeout + size cap. Returns either the parsed body or a structured
// error. Body-streaming and size enforcement live in `readBodyBounded`.
const fetchJsonBounded = async (url: URL): Promise<{ value: unknown } | { error: string }> => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    try {
        const response = await fetch(url, { signal: controller.signal });
        if (!response.ok) {
            return { error: `Failed to fetch "${url}": HTTP ${response.status} ${response.statusText}` };
        }
        const sizeProblem = checkAdvertisedSize(response, url);
        if (sizeProblem) return sizeProblem;
        const body = await readBodyBounded(response, url);
        if ('error' in body) return body;
        return { value: JSON.parse(body.value) };
    } catch (error) {
        return wrapFetchError(error, url);
    } finally {
        clearTimeout(timer);
    }
};

const collectGeometryTypes = (data: FeatureCollection): string[] => {
    const types = new Set<string>();
    for (const feature of data.features) {
        const t = feature.geometry?.type;
        if (t) types.add(t);
    }
    return [...types];
};

export const executeAddByodLayer = async (
    params: z.infer<typeof addByodLayerSchema>,
    state: ToolState,
): Promise<z.infer<typeof addByodLayerOutputSchema>> => {
    let data: unknown;
    let sourceRecord: { kind: 'url'; url: string } | { kind: 'inline' };

    if (params.url) {
        const urlCheck = validateUrl(params.url);
        if ('error' in urlCheck) return urlCheck;
        const fetched = await fetchJsonBounded(urlCheck.url);
        if ('error' in fetched) return fetched;
        data = fetched.value;
        sourceRecord = { kind: 'url', url: params.url };
    } else {
        data = params.data;
        sourceRecord = { kind: 'inline' };
    }

    if (!isFeatureCollection(data)) {
        return {
            error: 'Payload is not a GeoJSON FeatureCollection (`{ type: "FeatureCollection", features: [...] }`).',
        };
    }

    const byodEntryId = await state.byod.addEntry(data, params.label, {
        source: sourceRecord,
        ...(params.entryId && { explicitId: params.entryId }),
    });

    let shown = false;
    if (params.show) {
        try {
            await state.byod.showEntry(byodEntryId);
            shown = true;
        } catch (error) {
            // The entry is already in state, so we keep it — `updateByodDisplay` can retry the
            // render later. Surface the render error through the tool-result schema rather than
            // letting it reject the tool call.
            return {
                error: `addByodLayer added entry "${byodEntryId}" but rendering failed: ${
                    error instanceof Error ? error.message : String(error)
                }`,
            };
        }
    }

    return {
        byodEntryId,
        label: params.label,
        featureCount: data.features.length,
        geometryTypes: collectGeometryTypes(data),
        source: sourceRecord,
        shown,
    };
};
