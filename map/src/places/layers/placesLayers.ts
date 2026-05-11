import type {
    CircleLayerSpecification,
    ExpressionSpecification,
    Map as MapLibreMap,
    SymbolLayerSpecification,
} from 'maplibre-gl';
import { LayerSpecTemplate, LightDark, mapStyleLayerIDs } from '../../shared';
import { SELECTED_PIN_ICON_SIZE } from '../../shared/layers/commonLayerProps';
import { pinLayerBaseSpec } from '../../shared/layers/symbolLayers';
import type { PlaceLayerName, PlaceLayersConfig, PlacesModuleConfig } from '../types/placesModuleConfig';
import { buildCustomIconScalesMap, type IconScalesMap } from '../utils/customIconScales';
import { buildLayoutConfig, buildPaintConfig, buildTextFieldExpression } from '../utils/layerConfiguration';
import {
    buildBaseMapPOILayerSpec,
    buildCircleBaseLayerSpec,
    buildPOIMicroLikeLayerSpec,
} from '../utils/layerSpecBuilders';
import {
    buildClusterBadgeCircleLayerSpec,
    buildClusterCountTextLayerSpec,
    buildClusterMixedBadgeCircleLayerSpec,
    buildClusterMixedCountTextLayerSpec,
    buildClusterPinLayerSpec,
    isNotClusterFilter,
} from './clusterLayers';

/**
 * @ignore
 */
export const hasEventState: ExpressionSpecification = ['has', 'eventState'];

// A minimal placeholder spec used to keep a layer registered but hidden. This mirrors
// the pattern in `TrafficAreaAnalyticsModule` (toggling `layout.visibility`), so theme
// switches just flip visibility via `setLayoutProperty` without adding/removing layers.
const HIDDEN_LAYER_SPEC: LayerSpecTemplate<SymbolLayerSpecification> = {
    type: 'symbol',
    layout: { visibility: 'none' },
};

// Hidden circle-layer placeholder for the cluster badge slot. Like `HIDDEN_LAYER_SPEC`
// but typed as `circle` because the cluster badge is the only non-symbol layer the
// places module registers, and `addLayers`/`updateLayersAndSource` reject layer-type
// changes for an existing id.
const HIDDEN_CIRCLE_LAYER_SPEC: LayerSpecTemplate<CircleLayerSpecification> = {
    type: 'circle',
    layout: { visibility: 'none' },
};

/**
 * @ignore
 */
export const SELECTED_COLOR = '#3f9cd9';

/**
 * @ignore
 */
export const pinLayerSpec: LayerSpecTemplate<SymbolLayerSpecification> = {
    ...pinLayerBaseSpec,
    filter: ['!', hasEventState],
};

/**
 * We use an extra layer for highlighted text since it's not easy to enforce z-ordering with icons and text
 * while text has different collision rules.
 * @ignore
 */
export const selectedPinLayerSpec: LayerSpecTemplate<SymbolLayerSpecification> = {
    ...pinLayerBaseSpec,
    filter: hasEventState,
    layout: {
        ...pinLayerBaseSpec.layout,
        'icon-size': SELECTED_PIN_ICON_SIZE,
        'text-allow-overlap': true,
    },
    paint: {
        ...pinLayerBaseSpec.paint,
        'text-color': SELECTED_COLOR,
    },
};

// Per-theme builders: each returns the layer spec for one (theme, role) pair.
// `buildPlacesLayerSpecs` dispatches to these based on `config.theme`; roles a theme
// doesn't render fall back to `HIDDEN_LAYER_SPEC` so layers stay registered but
// invisible (theme switches toggle `visibility` rather than adding/removing layers).

// Derives a `selected` variant from a POI-like base spec: match only on event state,
// allow text overlap so selected labels stay visible, and paint text in SELECTED_COLOR.
const toSelectedPOILikeSpec = (
    base: LayerSpecTemplate<SymbolLayerSpecification>,
): LayerSpecTemplate<SymbolLayerSpecification> => ({
    ...base,
    filter: hasEventState,
    layout: {
        ...base.layout,
        'text-allow-overlap': true,
    },
    paint: {
        ...base.paint,
        'text-color': SELECTED_COLOR,
    },
});

const buildBaseMapSelectedLayerSpec = (mapLibreMap: MapLibreMap): LayerSpecTemplate<SymbolLayerSpecification> =>
    toSelectedPOILikeSpec(buildBaseMapPOILayerSpec(mapLibreMap));

const buildCircleIconMainLayerSpec = (mapLibreMap: MapLibreMap): LayerSpecTemplate<SymbolLayerSpecification> => ({
    ...buildCircleBaseLayerSpec(mapLibreMap),
    filter: ['!', hasEventState],
});

const buildCircleIconSelectedLayerSpec = (mapLibreMap: MapLibreMap): LayerSpecTemplate<SymbolLayerSpecification> =>
    toSelectedPOILikeSpec(buildCircleBaseLayerSpec(mapLibreMap));

// Subset of layer slots that go through the symbol-layer `withConfig` pipeline.
// Cluster slots are excluded because `clusterBadge` / `clusterMixedBadge` are
// circle layers and the cluster pin / count / mixed-count layers don't
// participate in EV availability or custom text expressions.
type SymbolPlaceLayerName = Exclude<
    PlaceLayerName,
    'cluster' | 'clusterBadge' | 'clusterCount' | 'clusterMixedBadge' | 'clusterMixedCount'
>;

// Compute a text-field override only when user config or EV availability demands it.
// Otherwise the layerSpec's own text-field passes through untouched — which lets the
// base-map `micro` layer keep the style's own expression verbatim and avoids redundantly
// re-setting the default on layers whose base spec already binds `text-field`.
const withConfig = (
    layerSpec: LayerSpecTemplate<SymbolLayerSpecification>,
    config: PlacesModuleConfig | undefined,
    layerName: SymbolPlaceLayerName,
    lightDark: LightDark,
    iconTextOffsetScales?: IconScalesMap,
): LayerSpecTemplate<SymbolLayerSpecification> => {
    const textConfig = config?.text;
    const customLayer = config?.layers?.[layerName];
    const evAvailabilityEnabled = config?.evAvailability?.enabled === true;

    const textField =
        textConfig?.title && typeof textConfig?.title !== 'function'
            ? textConfig.title
            : evAvailabilityEnabled
              ? buildTextFieldExpression(config, evAvailabilityEnabled)
              : undefined;

    return {
        ...layerSpec,
        ...customLayer,
        layout: buildLayoutConfig(layerSpec, config, layerName, textField, iconTextOffsetScales),
        paint: buildPaintConfig(layerSpec, config, layerName, lightDark),
    };
};

/**
 * Builds layer specifications for places display.
 * @ignore
 */
export const buildPlacesLayerSpecs = (
    config: PlacesModuleConfig | undefined,
    mapLibreMap: MapLibreMap,
    styleLightDarkTheme: LightDark,
    instanceIndex: number,
): PlaceLayersConfig => {
    const iconTextOffsetScales = buildCustomIconScalesMap(config, instanceIndex);

    let main: LayerSpecTemplate<SymbolLayerSpecification>;
    let selected: LayerSpecTemplate<SymbolLayerSpecification>;
    // `micro` is always registered so theme switches only update its filter/paint/layout
    // (fast path via `updateLayersAndSource` + `changeLayerProps`) rather than adding or
    // removing a layer. For themes that don't render on `micro` it's kept present but
    // hidden via `layout.visibility = 'none'`.
    let micro: LayerSpecTemplate<SymbolLayerSpecification> = HIDDEN_LAYER_SPEC;

    // Cluster slots: same "always-registered, toggled via visibility" pattern as `micro`.
    // Only the `pin-clustered` theme populates them with real specs.
    let cluster: LayerSpecTemplate<SymbolLayerSpecification> = HIDDEN_LAYER_SPEC;
    let clusterBadge: LayerSpecTemplate<CircleLayerSpecification> = HIDDEN_CIRCLE_LAYER_SPEC;
    let clusterCount: LayerSpecTemplate<SymbolLayerSpecification> = HIDDEN_LAYER_SPEC;
    let clusterMixedBadge: LayerSpecTemplate<CircleLayerSpecification> = HIDDEN_CIRCLE_LAYER_SPEC;
    let clusterMixedCount: LayerSpecTemplate<SymbolLayerSpecification> = HIDDEN_LAYER_SPEC;

    if (config?.theme === 'base-map') {
        main = { ...buildBaseMapPOILayerSpec(mapLibreMap), minzoom: 10 };
        micro = buildPOIMicroLikeLayerSpec(mapLibreMap);
        selected = buildBaseMapSelectedLayerSpec(mapLibreMap);
    } else if (config?.theme === 'circle-icon') {
        main = buildCircleIconMainLayerSpec(mapLibreMap);
        selected = buildCircleIconSelectedLayerSpec(mapLibreMap);
    } else if (config?.theme === 'pin-clustered') {
        // The pin layers stay the same as the regular `pin` theme but are restricted
        // to non-cluster (singleton) features so a clustered point is not double-drawn
        // as both a cluster pin and an individual pin. The dedicated cluster pin layer
        // renders single-category clusters with that category's base-map sprite;
        // mixed clusters skip the icon and surface a centred count circle via
        // `clusterMixedBadge` + `clusterMixedCount`.
        //
        // The `micro` slot is also populated — same builder the `base-map` theme uses
        // — restricted to non-cluster features so it only renders the un-clustered
        // singletons under the base-map style's POI - Micro layer expressions, blending
        // them with the native base-map POIs at low zoom.
        main = { ...pinLayerSpec, filter: ['all', isNotClusterFilter, ['!', hasEventState]] };
        selected = { ...selectedPinLayerSpec, filter: ['all', isNotClusterFilter, hasEventState] };
        const microBase = buildPOIMicroLikeLayerSpec(mapLibreMap);
        micro = {
            ...microBase,
            filter: microBase.filter
                ? (['all', isNotClusterFilter, microBase.filter] as ExpressionSpecification)
                : isNotClusterFilter,
        };
        cluster = buildClusterPinLayerSpec();
        clusterBadge = buildClusterBadgeCircleLayerSpec();
        clusterCount = buildClusterCountTextLayerSpec();
        clusterMixedBadge = buildClusterMixedBadgeCircleLayerSpec();
        clusterMixedCount = buildClusterMixedCountTextLayerSpec();
    } else {
        // pin (default)
        main = pinLayerSpec;
        selected = selectedPinLayerSpec;
    }

    // Layer stacking (bottom → top): micro < main < selected, expressed via
    // `beforeID` so `addLayers` resolves ordering the same way RoutingModule does.
    // PlacesModule rewrites these internal names into instance-scoped layer IDs.
    // Cluster slots stack on top: cluster pin < clusterBadge < clusterCount <
    // clusterMixedBadge < clusterMixedCount, anchored above `selected` so the
    // count text is always legible. The mixed-cluster pair is last so the
    // centred count circle paints on top of the (filtered-out) single-cluster
    // slots without depending on draw-order luck.

    return {
        micro: {
            ...withConfig(micro, config, 'micro', styleLightDarkTheme, iconTextOffsetScales),
            beforeID: mapStyleLayerIDs.lowestPlaceLabel,
        },
        main: {
            ...withConfig(main, config, 'main', styleLightDarkTheme, iconTextOffsetScales),
            beforeID: 'selected',
        },
        selected: withConfig(selected, config, 'selected', styleLightDarkTheme, iconTextOffsetScales),
        cluster: {
            ...cluster,
            ...config?.layers?.cluster,
            beforeID: 'clusterBadge',
        },
        clusterBadge: {
            ...clusterBadge,
            ...config?.layers?.clusterBadge,
            beforeID: 'clusterCount',
        },
        clusterCount: {
            ...clusterCount,
            ...config?.layers?.clusterCount,
            beforeID: 'clusterMixedBadge',
        },
        clusterMixedBadge: {
            ...clusterMixedBadge,
            ...config?.layers?.clusterMixedBadge,
            beforeID: 'clusterMixedCount',
        },
        clusterMixedCount: {
            ...clusterMixedCount,
            ...config?.layers?.clusterMixedCount,
        },
        ...config?.layers?.additional,
    };
};
