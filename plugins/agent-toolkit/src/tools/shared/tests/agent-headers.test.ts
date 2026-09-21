/**
 * Verifies both paths that tag agent-toolkit traffic reach the wire with the same value: service
 * requests via `withAgentToolkitHeaders`, and the map's own MapLibre requests via `createMapAgent`.
 *
 * Mocks `fetch`, generates input for each tool in `DEFAULT_TOOLS` from its own zod `inputSchema`,
 * runs the tool, and inspects whatever requests actually fire.
 */
import { TOMTOM_USER_AGENT_SDK_NAME } from '@tomtom-org/maps-sdk/core';
import type { TomTomMap } from '@tomtom-org/maps-sdk/map';
import type { LanguageModel } from 'ai';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { createMapAgent } from '../../../create-map-agent';
import {
    PlacesState,
    RangeState,
    RoutingState,
    TrafficAreaAnalyticsState,
    TrafficIncidentsState,
} from '../../../state';
import { makeMockState } from '../../../tests/constants';
import type { ToolBuildOptions, ToolEntry, ToolState } from '../../../types';
import { DEFAULT_TOOLS } from '../../tool-registry';
import { AGENT_TOOLKIT_ID, AGENT_TOOLKIT_USER_AGENT } from '../agent-headers';

const EXPECTED_TAG_PREFIX = `${TOMTOM_USER_AGENT_SDK_NAME}-${AGENT_TOOLKIT_ID}/`;

type JSONSchemaNode = {
    type?: string | string[];
    properties?: Record<string, JSONSchemaNode>;
    items?: JSONSchemaNode;
    anyOf?: JSONSchemaNode[];
    oneOf?: JSONSchemaNode[];
    enum?: unknown[];
    const?: unknown;
    minItems?: number;
};

const NAME_HINTS: Record<string, unknown> = {
    language: 'en-GB',
    lng: 4.9,
    lat: 52.4,
    startDate: '2024-01-01',
    endDate: '2024-01-02',
    date: '2024-01-01T00:00:00Z',
};

const EXCLUSIVE_PAIRS: [drop: string, whenPresent: string][] = [
    ['viewport', 'position'],
    ['location', 'bbox'],
    ['days', 'startDate'],
];

const isIdReferenceField = (name: string): boolean => name === 'range' || /id(s)?$/i.test(name);

const pickBranch = (branches: JSONSchemaNode[]): JSONSchemaNode =>
    branches.find((b) => b.properties && 'position' in b.properties) ?? branches[0];

const droppedPropertyNames = (properties: [string, JSONSchemaNode][]): Set<string> => {
    const names = new Set(properties.map(([key]) => key));
    return new Set(EXCLUSIVE_PAIRS.filter(([, whenPresent]) => names.has(whenPresent)).map(([drop]) => drop));
};

const generateObject = (schema: JSONSchemaNode): Record<string, unknown> => {
    const properties = Object.entries(schema.properties ?? {});
    const dropped = droppedPropertyNames(properties);
    const obj: Record<string, unknown> = {};
    for (const [key, propSchema] of properties) {
        if (dropped.has(key) || isIdReferenceField(key)) continue;
        obj[key] = generate(propSchema, key);
    }
    return obj;
};

const generateArray = (schema: JSONSchemaNode, propName?: string): unknown[] | undefined => {
    const itemType = Array.isArray(schema.items?.type) ? schema.items?.type[0] : schema.items?.type;
    if (itemType === 'array' && schema.items?.minItems === undefined) return undefined;
    return Array.from({ length: schema.minItems ?? 1 }, () => generate(schema.items, propName));
};

const generate = (schema: JSONSchemaNode | undefined, propName?: string): unknown => {
    if (!schema) return undefined;
    if (schema.const !== undefined) return schema.const;
    if (propName && propName in NAME_HINTS) return NAME_HINTS[propName];
    if (schema.enum?.length) return schema.enum[0];
    if (schema.anyOf?.length) return generate(pickBranch(schema.anyOf), propName);
    if (schema.oneOf?.length) return generate(pickBranch(schema.oneOf), propName);

    const type = Array.isArray(schema.type) ? schema.type[0] : schema.type;
    switch (type) {
        case 'object':
            return generateObject(schema);
        case 'array':
            return generateArray(schema, propName);
        case 'string':
            return 'test';
        case 'number':
        case 'integer':
            return 0;
        case 'boolean':
            return false;
        default:
            return undefined;
    }
};

const generateParams = (inputSchema: unknown): Record<string, unknown> =>
    generate(z.toJSONSchema(inputSchema as never) as JSONSchemaNode) as Record<string, unknown>;

const resolveEntry = (name: string): ToolEntry => {
    const definition = DEFAULT_TOOLS[name as keyof typeof DEFAULT_TOOLS];
    const buildOptions: ToolBuildOptions = {};
    return typeof definition === 'function' ? definition(buildOptions) : (definition as ToolEntry);
};

const buildDefaultState = (): ToolState =>
    makeMockState({
        places: new PlacesState({} as TomTomMap),
        routing: new RoutingState({} as TomTomMap),
        ranges: new RangeState({} as TomTomMap),
        trafficIncidents: new TrafficIncidentsState({
            mapLibreMap: { getSource: () => undefined, getLayer: () => undefined },
        } as unknown as TomTomMap),
        trafficAreaAnalytics: new TrafficAreaAnalyticsState({} as TomTomMap),
    });

describe('agent-toolkit tags every request it causes', () => {
    let fetchSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
        process.env.MOVE_PORTAL_KEY = 'test-move-portal-key';
        // A new Response per call — a Response body can only be read once.
        fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async () => new Response('{}', { status: 200 }));
    });

    afterEach(() => {
        fetchSpy.mockRestore();
    });

    // Runs every registered tool once with generated input.
    // Collects every TomTom request each tool makes along the way.
    // Fails if any of them is missing or has the wrong tag.
    it('sends tomtom-user-agent: MapsSDKJS-AgentToolkit/<version> on every request the toolkit makes', async () => {
        const violations: string[] = [];

        for (const name of Object.keys(DEFAULT_TOOLS)) {
            const entry = resolveEntry(name);
            const params = generateParams(entry.inputSchema);
            const state = buildDefaultState();

            fetchSpy.mockClear();
            await entry.execute(params as never, state).catch(() => undefined);

            for (const call of fetchSpy.mock.calls) {
                const [input, requestInit] = call;
                // `input` is a string, a `URL`, or a `Request`.
                let url: string;
                if (typeof input === 'string') {
                    url = input;
                } else if (input instanceof Request) {
                    url = input.url;
                } else {
                    url = input.href;
                }
                if (!/(^|\.)tomtom\.com$/.test(new URL(url).hostname)) continue;

                const headers = new Headers(requestInit?.headers);
                const tag = headers.get('tomtom-user-agent');
                if (!tag?.startsWith(EXPECTED_TAG_PREFIX)) {
                    violations.push(`${name}: got "${tag}"`);
                }
            }
        }

        expect(violations, `untagged/mistagged request(s):\n${violations.join('\n')}`).toEqual([]);
    });

    // No request to inspect on this path: it hangs entirely on the one `_setTomTomUserAgent` call in
    // `createMapAgent`, and dropping that line would leave tiles tagged as plain SDK traffic.
    it('tags the map it is handed with the same value as the service requests', () => {
        const setUserAgent = vi.fn();
        const map = {
            _setTomTomUserAgent: setUserAgent,
            mapLibreMap: {
                getContainer: () => ({}) as HTMLElement,
                getStyle: () => ({ layers: [], sources: {} }),
                getSource: () => undefined,
                getLayer: () => undefined,
                on: vi.fn(),
                off: vi.fn(),
                once: vi.fn(),
            },
        } as unknown as TomTomMap;

        createMapAgent(map, { model: {} as LanguageModel });

        expect(setUserAgent).toHaveBeenCalledWith(AGENT_TOOLKIT_USER_AGENT);
        // Same prefix the service assertion above enforces.
        expect(AGENT_TOOLKIT_USER_AGENT.startsWith(EXPECTED_TAG_PREFIX)).toBe(true);
    });
});
