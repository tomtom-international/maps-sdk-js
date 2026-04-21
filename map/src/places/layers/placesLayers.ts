import type { ExpressionSpecification, Map as MapLibreMap, SymbolLayerSpecification } from 'maplibre-gl';
import type { LayerSpecTemplate, LightDark } from '../../shared';
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

// Compute a text-field override only when user config or EV availability demands it.
// Otherwise the layerSpec's own text-field passes through untouched — which lets the
// base-map `micro` layer keep the style's own expression verbatim and avoids redundantly
// re-setting the default on layers whose base spec already binds `text-field`.
const withConfig = (
    layerSpec: LayerSpecTemplate<SymbolLayerSpecification>,
    config: PlacesModuleConfig | undefined,
    layerName: PlaceLayerName,
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

    if (config?.theme === 'base-map') {
        main = buildBaseMapPOILayerSpec(mapLibreMap);
        micro = buildPOIMicroLikeLayerSpec(mapLibreMap);
        selected = buildBaseMapSelectedLayerSpec(mapLibreMap);
    } else if (config?.theme === 'circle-icon') {
        main = buildCircleIconMainLayerSpec(mapLibreMap);
        selected = buildCircleIconSelectedLayerSpec(mapLibreMap);
    } else {
        // pin (default)
        main = pinLayerSpec;
        selected = selectedPinLayerSpec;
    }

    // Layer stacking (bottom → top): micro < main < selected, expressed via
    // `beforeID` so `addLayers` resolves ordering the same way RoutingModule does.
    // PlacesModule rewrites these internal names into instance-scoped layer IDs.
    return {
        micro: {
            ...withConfig(micro, config, 'micro', styleLightDarkTheme, iconTextOffsetScales),
            beforeID: 'main',
        },
        main: {
            ...withConfig(main, config, 'main', styleLightDarkTheme, iconTextOffsetScales),
            beforeID: 'selected',
        },
        selected: withConfig(selected, config, 'selected', styleLightDarkTheme, iconTextOffsetScales),
        ...config?.layers?.additional,
    };
};
