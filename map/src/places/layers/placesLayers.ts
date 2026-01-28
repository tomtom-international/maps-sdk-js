import type { ExpressionSpecification, Map as MapLibreMap, SymbolLayerSpecification } from 'maplibre-gl';
import type { LayerSpecTemplate, LightDark } from '../../shared';
import { SELECTED_PIN_ICON_SIZE } from '../../shared/layers/commonLayerProps';
import { pinLayerBaseSpec } from '../../shared/layers/symbolLayers';
import type { PlaceLayerName, PlaceLayersConfig, PlacesModuleConfig } from '../types/placesModuleConfig';
import { buildCustomIconScalesMap, type IconScalesMap } from '../utils/customIconScales';
import { buildLayoutConfig, buildPaintConfig, buildTextFieldExpression } from '../utils/layerConfiguration';
import { buildPoiLikeLayerSpec } from '../utils/layerSpecBuilders';

/**
 * @ignore
 */
export const hasEventState: ExpressionSpecification = ['has', 'eventState'];

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

/**
 * Applies configuration to a layer specification template.
 * @ignore
 */
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

    const textFieldExpression = buildTextFieldExpression(config, evAvailabilityEnabled);
    const textField =
        textConfig?.title && typeof textConfig?.title !== 'function' ? textConfig.title : textFieldExpression;

    return {
        ...layerSpec,
        layout: buildLayoutConfig(layerSpec, config, layerName, textField, iconTextOffsetScales),
        paint: buildPaintConfig(layerSpec, config, layerName, lightDark),
        ...customLayer,
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

    // Build layer spec templates based on the configured theme
    let main: LayerSpecTemplate<SymbolLayerSpecification>;
    let selected: LayerSpecTemplate<SymbolLayerSpecification>;

    if (config?.theme === 'base-map') {
        const poiLikeLayerSpec = buildPoiLikeLayerSpec(mapLibreMap);
        main = poiLikeLayerSpec;
        selected = {
            ...poiLikeLayerSpec,
            filter: hasEventState,
            layout: {
                ...poiLikeLayerSpec.layout,
                'text-allow-overlap': true,
            },
            paint: {
                ...poiLikeLayerSpec.paint,
                'text-color': SELECTED_COLOR,
            },
        };
    } else {
        // pin / circle
        main = pinLayerSpec;
        selected = selectedPinLayerSpec;
    }

    return {
        main: withConfig(main, config, 'main', styleLightDarkTheme, iconTextOffsetScales),
        selected: withConfig(selected, config, 'selected', styleLightDarkTheme, iconTextOffsetScales),
        ...config?.layers?.additional,
    };
};
