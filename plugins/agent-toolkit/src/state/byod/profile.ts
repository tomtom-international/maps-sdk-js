/**
 * @module agent-toolkit-state
 *
 * Runtime "schema" inference for a BYOD FeatureCollection. A BYOD entry's only
 * guaranteed shape is "GeoJSON FeatureCollection" — the geometry types and the
 * feature `properties` are whatever the customer's data happens to carry. This
 * module derives a compact, token-frugal profile of that shape so the agent can
 * reason about the data (which properties to filter on, what geometry to expect)
 * without ever shipping the full collection to the model.
 *
 * Dependency-free on purpose: a generic JSON-Schema inferrer (`to-json-schema`,
 * `generate-schema`, …) would emit verbose, deeply-nested schemas that cost more
 * tokens than they save and still need GeoJSON-specific post-processing. A single
 * linear pass over the features yields exactly the fields the LLM needs.
 */

import type { FeatureCollection, GeoJsonProperties } from 'geojson';

/** Compact profile of one feature-`properties` key across the whole collection. */
export type BYODPropertyProfile = {
    /** Property key as it appears in `feature.properties`. */
    name: string;
    /** Distinct JSON value types seen for this key (e.g. `["string"]`, `["number", "null"]`). */
    types: string[];
    /** Fraction of features carrying this key, 0–1 (1 = present on every feature). */
    coverage: number;
    /** Up to a few short, distinct example values — lets the LLM infer semantics. */
    examples: Array<string | number | boolean>;
};

/**
 * Token-frugal description of a BYOD FeatureCollection's runtime shape: feature
 * count, the geometry types present, and a per-property profile. Stored on every
 * {@link BYODEntry} and surfaced through `addByodSource` / `recallState`
 * so the model never has to receive raw GeoJSON just to learn the schema.
 *
 * @group Agent Toolkit
 */
export type BYODDataProfile = {
    featureCount: number;
    /** GeoJSON geometry types present (Point / LineString / Polygon / …). */
    geometryTypes: string[];
    /** Per-property profile, highest-coverage first. Capped — see `propertiesOmitted`. */
    properties: BYODPropertyProfile[];
    /** Count of property keys omitted when the collection has more distinct keys than the cap. */
    propertiesOmitted?: number;
};

// Caps that bound the profile's size regardless of how wide or heterogeneous the
// customer data is — the profile is meant to be cheap to ship to the model.
const MAX_PROPERTIES = 40;
const MAX_EXAMPLES_PER_PROPERTY = 3;
const MAX_EXAMPLE_STRING_LENGTH = 60;

const jsonTypeOf = (value: unknown): string => {
    if (value === null) return 'null';
    if (Array.isArray(value)) return 'array';
    return typeof value;
};

// Accumulator built per property key during the single pass, then collapsed into
// a BYODPropertyProfile at the end.
type PropertyAccumulator = {
    count: number;
    types: Set<string>;
    examples: Array<string | number | boolean>;
};

const recordExample = (accumulator: PropertyAccumulator, value: unknown): void => {
    if (accumulator.examples.length >= MAX_EXAMPLES_PER_PROPERTY) return;
    // Only primitives make compact, useful examples; objects/arrays are captured by `types`.
    if (typeof value === 'string') {
        const trimmed =
            value.length > MAX_EXAMPLE_STRING_LENGTH ? `${value.slice(0, MAX_EXAMPLE_STRING_LENGTH)}…` : value;
        if (!accumulator.examples.includes(trimmed)) accumulator.examples.push(trimmed);
        return;
    }

    if (typeof value === 'number' || typeof value === 'boolean') {
        if (!accumulator.examples.includes(value)) accumulator.examples.push(value);
    }
};

const collectGeometryTypes = (data: FeatureCollection): string[] => {
    const types = new Set<string>();
    for (const feature of data.features) {
        const type = feature.geometry?.type;
        if (type) types.add(type);
    }
    return [...types];
};

const accumulateProperties = (data: FeatureCollection): Map<string, PropertyAccumulator> => {
    const byKey = new Map<string, PropertyAccumulator>();
    for (const feature of data.features) {
        const properties: GeoJsonProperties = feature.properties;
        if (!properties || typeof properties !== 'object') continue;
        for (const [key, value] of Object.entries(properties)) {
            let accumulator = byKey.get(key);
            if (!accumulator) {
                accumulator = { count: 0, types: new Set(), examples: [] };
                byKey.set(key, accumulator);
            }
            accumulator.count += 1;
            accumulator.types.add(jsonTypeOf(value));
            recordExample(accumulator, value);
        }
    }
    return byKey;
};

/**
 * Derive a {@link BYODDataProfile} from a GeoJSON FeatureCollection in a single
 * linear pass. Bounded output: at most {@link MAX_PROPERTIES} property profiles,
 * each with at most a few short examples.
 *
 * @ignore
 */
export const profileFeatureCollection = (data: FeatureCollection): BYODDataProfile => {
    const featureCount = data.features.length;
    const byKey = accumulateProperties(data);

    const allProperties: BYODPropertyProfile[] = [...byKey.entries()]
        .map(([name, accumulator]) => ({
            name,
            types: [...accumulator.types],
            coverage: featureCount > 0 ? Math.round((accumulator.count / featureCount) * 100) / 100 : 0,
            examples: accumulator.examples,
        }))
        // Highest-coverage first, then alphabetical — the most-shared keys read first.
        .sort((first, second) => second.coverage - first.coverage || first.name.localeCompare(second.name));

    const properties = allProperties.slice(0, MAX_PROPERTIES);
    const propertiesOmitted = allProperties.length - properties.length;

    return {
        featureCount,
        geometryTypes: collectGeometryTypes(data),
        properties,
        ...(propertiesOmitted > 0 && { propertiesOmitted }),
    };
};

/**
 * Strip attacker-controlled free-text from a {@link BYODDataProfile} before it
 * crosses into the language model's context. A BYOD entry's data is supplied by
 * the customer (URL fetch / inline GeoJSON), so its property string VALUES are
 * untrusted — a malicious feature could carry prompt-injection text in a
 * property value, and those values are exactly what {@link profileFeatureCollection}
 * samples into each property's `examples`.
 *
 * This keeps every *structural* part of the profile (feature count, geometry
 * types, property key names, JSON types, coverage, `propertiesOmitted`) and the
 * numeric / boolean examples (which cannot carry instructions), and drops only
 * the **string** examples. The full profile — examples included — stays on the
 * {@link BYODEntry} for the embedding app to render directly to the user; it is
 * just never echoed back to the model as if it were trusted.
 *
 * @group Agent Toolkit
 */
export const toByodSafeProfile = (profile: BYODDataProfile): BYODDataProfile => ({
    ...profile,
    properties: profile.properties.map((property) => ({
        ...property,
        examples: property.examples.filter((value) => typeof value !== 'string'),
    })),
});
