import type { LayerSpecification } from 'maplibre-gl';
import { poiLayerIDs } from '../pois';
import type { LayerSpecFilter } from '../shared';
import { type LayerSelector, matchesLayerSelector } from '../shared/layers/layerSelector';
import {
    type BaseMapLayerGroupName,
    type BaseMapLayerGroups,
    baseMapLayerGroupNames,
} from './types/baseMapModuleConfig';

// Layers are classified by the style's `metadata.group` — the authoritative
// taxonomy TomTom ships with the style — rather than by their (unstable) layer
// ids. `idIncludes`/`idExcludes` only sub-split a single metadata group (roads
// and place labels), and `layerTypes` disambiguates where a metadata group mixes
// geometry types. The matching rule itself is shared with the styling knobs.
type LayerGroupMapping = LayerSelector & { metadataGroups: string[] };

// Rail/ferry/aerialway lines carved out of the `road` metadata group by layer id.
const railAndWaterTransitIDs = ['railway', 'subway', 'aerialway', 'ferry'];

const layerGroupMappings: Record<BaseMapLayerGroupName, LayerGroupMapping> = {
    // 'area' fills plus the base 'background' canvas.
    land: { metadataGroups: ['area', 'background'] },
    water: { metadataGroups: ['water'] },
    natureLabels: { metadataGroups: ['label'] },

    // All road geometry (incl. paths, tracks and road/transit surface areas)
    // except rail/ferry/aerialway lines, which get their own groups.
    roads: { metadataGroups: ['road', 'road_area', 'transit_area'], idExcludes: railAndWaterTransitIDs },
    railways: { metadataGroups: ['road'], layerTypes: ['line'], idIncludes: ['railway', 'subway', 'aerialway'] },
    ferries: { metadataGroups: ['road'], layerTypes: ['line'], idIncludes: ['ferry'] },

    buildings2D: { metadataGroups: ['building'], layerTypes: ['fill', 'line'] },
    buildings3D: { metadataGroups: ['area_3d', 'building'], layerTypes: ['fill-extrusion'] },

    // Admin boundaries, overlays (military/protected) and boundary labels.
    borders: { metadataGroups: ['border', 'border_label'] },

    // `road_label` split into shields vs. everything else.
    roadLabels: { metadataGroups: ['road_label'], idExcludes: ['shield'] },
    roadShields: { metadataGroups: ['road_label'], idIncludes: ['shield'] },
    houseNumbers: { metadataGroups: ['address_point_label'] },

    // `allPlaceLabels` is the superset of the whole `places_label` group; the
    // groups below are narrower sub-selections of it, split by layer id.
    allPlaceLabels: { metadataGroups: ['places_label'] },
    smallerTownLabels: { metadataGroups: ['places_label'], idIncludes: ['neighbourhood', 'village', 'hamlet', 'town'] },
    cityLabels: { metadataGroups: ['places_label'], idIncludes: ['city'] },
    capitalLabels: { metadataGroups: ['places_label'], idIncludes: ['capital'] },
    stateLabels: { metadataGroups: ['places_label'], idIncludes: ['state'] },
    countryLabels: { metadataGroups: ['places_label'], idIncludes: ['country'] },
};

const isMatching = (group: BaseMapLayerGroupName, layer: LayerSpecification) =>
    matchesLayerSelector(layerGroupMappings[group], layer);

/**
 * The selector behind a base-map layer group, for other curated maps (the styling knobs) that
 * want to build on the same taxonomy instead of restating it.
 * @ignore
 */
export const baseMapLayerGroupSelector = (group: BaseMapLayerGroupName): LayerSelector => layerGroupMappings[group];

/**
 * @ignore
 */
export const buildLayerGroupFilter = (layerGroups: BaseMapLayerGroups): LayerSpecFilter => {
    const mode = layerGroups.mode;
    const groups = layerGroups.names;
    if (mode === 'include') {
        return (layer) => groups.some((group) => isMatching(group, layer));
    }
    if (mode === 'exclude') {
        return (layer) => !groups.some((group) => isMatching(group, layer));
    }
    // No filtering if we don't recognize the mode:
    console.error('Unrecognized layer group mode:', mode);
    return () => true;
};

/**
 * The layers the base map module manages: everything in the base-map source except the POI
 * layers, which {@link POIsModule} owns.
 *
 * @ignore
 */
export const baseMapLayerFilter: LayerSpecFilter = (layer: LayerSpecification): boolean =>
    !poiLayerIDs.includes(layer.id);

/**
 * Classifies the given layers into every base-map layer group they belong to,
 * using the same `metadata.group` matching as the visibility filters.
 *
 * The result has an entry for every {@link BaseMapLayerGroupName} (empty array
 * when no layer matches), so callers get a stable, fully-keyed record. Layer ids
 * keep their style z-order within each group. Groups intentionally overlap — e.g.
 * a city label is in both `cityLabels` and `allPlaceLabels` — so a layer id can
 * appear under several groups.
 *
 * @ignore
 */
export const groupBaseMapLayers = (layers: LayerSpecification[]): Record<BaseMapLayerGroupName, string[]> => {
    const grouped = Object.fromEntries(baseMapLayerGroupNames.map((group) => [group, [] as string[]])) as Record<
        BaseMapLayerGroupName,
        string[]
    >;
    for (const layer of layers) {
        for (const group of baseMapLayerGroupNames) {
            if (isMatching(group, layer)) grouped[group].push(layer.id);
        }
    }
    return grouped;
};
