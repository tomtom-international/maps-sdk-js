import type { LayerSpecification } from 'maplibre-gl';

/**
 * Picks style layers by the taxonomy TomTom ships with the style rather than by their (unstable)
 * ids: `metadata.group` first, then optional narrowing by layer type, source layer and
 * case-insensitive id fragments. Every constraint given must hold.
 *
 * This is the one matching rule behind the base-map layer groups and the styling knobs, so a
 * curated map is a small data table rather than code, and a style-version bump is checked by
 * running the same tables against the new style.
 *
 * @ignore
 */
export type LayerSelector = {
    /** Values of `metadata.group` the layer may carry. Omit to accept any group. */
    metadataGroups?: string[];
    /** Layer types the layer may have. */
    layerTypes?: LayerSpecification['type'][];
    /** Sources the layer must draw from. */
    sources?: string[];
    /**
     * Source types (`vector`, `raster`, `geojson`…) the layer's source may have. Needs the style's
     * sources to be passed along when matching; without them this constraint cannot hold.
     */
    sourceTypes?: string[];
    /** Source layers (vector tile layers) the layer must draw from. */
    sourceLayers?: string[];
    /** The layer id must contain at least one of these fragments (case-insensitive). */
    idIncludes?: string[];
    /** The layer id must contain none of these fragments (case-insensitive). */
    idExcludes?: string[];
};

/**
 * @ignore
 */
export const metadataGroupOf = (layer: LayerSpecification): string | undefined => {
    const metadata = layer.metadata;
    if (metadata && typeof metadata === 'object' && 'group' in metadata) {
        const group = (metadata as { group?: unknown }).group;
        return typeof group === 'string' ? group : undefined;
    }
    return undefined;
};

const sourceOf = (layer: LayerSpecification): string | undefined =>
    'source' in layer && typeof layer.source === 'string' ? layer.source : undefined;

const sourceLayerOf = (layer: LayerSpecification): string | undefined =>
    'source-layer' in layer && typeof layer['source-layer'] === 'string' ? layer['source-layer'] : undefined;

/**
 * The style's sources, for selectors that constrain the source type.
 * @ignore
 */
export type StyleSources = Record<string, { type: string }>;

const sourceTypeOf = (layer: LayerSpecification, styleSources?: StyleSources): string | undefined => {
    const source = sourceOf(layer);
    return source === undefined ? undefined : styleSources?.[source]?.type;
};

// Every list constraint is optional in the same way: an omitted list accepts any layer, a given one
// has to hold the value the layer carries — and a layer carrying nothing there never matches.
const matchesOneOf = <VALUE>(allowed: readonly VALUE[] | undefined, value: VALUE | undefined): boolean =>
    !allowed || (value !== undefined && allowed.includes(value));

const matchesIdFragments = (selector: LayerSelector, layer: LayerSpecification): boolean => {
    const id = layer.id.toLowerCase();
    const isInId = (fragment: string) => id.includes(fragment.toLowerCase());
    if (selector.idIncludes && !selector.idIncludes.some(isInId)) return false;

    return !selector.idExcludes?.some(isInId);
};

/**
 * Whether a layer satisfies every constraint of the selector.
 * @ignore
 */
export const matchesLayerSelector = (
    selector: LayerSelector,
    layer: LayerSpecification,
    styleSources?: StyleSources,
): boolean =>
    matchesOneOf(selector.metadataGroups, metadataGroupOf(layer)) &&
    matchesOneOf(selector.layerTypes, layer.type) &&
    matchesOneOf(selector.sources, sourceOf(layer)) &&
    matchesOneOf(selector.sourceTypes, sourceTypeOf(layer, styleSources)) &&
    matchesOneOf(selector.sourceLayers, sourceLayerOf(layer)) &&
    matchesIdFragments(selector, layer);

/**
 * Whether a layer satisfies at least one of the selectors.
 * @ignore
 */
export const matchesAnyLayerSelector = (
    selectors: LayerSelector[],
    layer: LayerSpecification,
    styleSources?: StyleSources,
): boolean => selectors.some((selector) => matchesLayerSelector(selector, layer, styleSources));
