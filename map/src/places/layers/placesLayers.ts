import type {
    DataDrivenPropertyValueSpecification,
    ExpressionSpecification,
    Map,
    SymbolLayerSpecification,
} from 'maplibre-gl';
import type { LayerSpecTemplate } from '../../shared';
import { SELECTED_PIN_ICON_SIZE } from '../../shared/layers/commonLayerProps';
import { isClickEventState } from '../../shared/layers/eventState';
import { ICON_ID, pinLayerBaseSpec, TITLE } from '../../shared/layers/symbolLayers';
import type { PlaceLayerName, PlaceLayersConfig, PlacesModuleConfig } from '../types/placesModuleConfig';

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
export const placesLayerSpec: LayerSpecTemplate<SymbolLayerSpecification> = {
    ...pinLayerBaseSpec,
    filter: ['!', hasEventState],
};

/**
 * We use an extra layer for highlighted text since it's not easy to enforce z-ordering with icons and text
 * while text has different collision rules.
 * @ignore
 */
export const selectedPlaceLayerSpec: LayerSpecTemplate<SymbolLayerSpecification> = {
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
 * @ignore
 */
export const clickedPlaceLayerSpec: LayerSpecTemplate<SymbolLayerSpecification> = {
    ...selectedPlaceLayerSpec,
    filter: isClickEventState,
};

const withConfig = (
    layerSpec: LayerSpecTemplate<SymbolLayerSpecification>,
    config: PlacesModuleConfig | undefined,
    layerName: PlaceLayerName,
): LayerSpecTemplate<SymbolLayerSpecification> => {
    const textConfig = config?.text;
    const customLayer = config?.layers?.[layerName];
    return {
        ...layerSpec,
        layout: {
            ...layerSpec.layout,
            ...(textConfig?.size && { 'text-size': textConfig.size }),
            ...(textConfig?.font && { 'text-font': textConfig.font }),
            ...(textConfig?.offset && { 'text-offset': textConfig.offset }),
            ...(textConfig?.title &&
                typeof textConfig?.title !== 'function' && {
                    'text-field': textConfig?.title,
                }),
        },
        paint: {
            ...layerSpec.paint,
            ...(textConfig?.color && { 'text-color': textConfig.color }),
            ...(textConfig?.haloColor && { 'text-halo-color': textConfig.haloColor }),
            ...(textConfig?.haloWidth && { 'text-halo-width': textConfig.haloWidth }),
        },
        ...customLayer,
    };
};

/**
 * @ignore
 */
export const getTextSizeSpec = (
    textSize?: DataDrivenPropertyValueSpecification<number>,
): DataDrivenPropertyValueSpecification<number> => {
    return JSON.parse(JSON.stringify(textSize)?.replace(/name/g, TITLE));
};

const buildPoiLikeLayerSpec = (map: Map): LayerSpecTemplate<SymbolLayerSpecification> => {
    const poiLayer = (map.getStyle().layers.filter((layer) => layer.id === 'POI')[0] as SymbolLayerSpecification) || {};
    const textSize = poiLayer.layout?.['text-size'];
    return {
        filter: ['!', isClickEventState],
        type: 'symbol',
        paint: poiLayer.paint,
        layout: {
            ...poiLayer.layout,
            'text-field': ['get', TITLE],
            'icon-image': ['get', ICON_ID],
            ...(textSize && { 'text-size': getTextSizeSpec(textSize) }),
        },
    };
};

/**
 * @ignore
 */
export const buildPlacesLayerSpecs = (config: PlacesModuleConfig | undefined, map: Map): PlaceLayersConfig => {
    // Build the layer spec templates based on the theme:
    let layerSpecTemplates;
    if (config?.theme === 'base-map') {
        const poiLikeLayerSpec = buildPoiLikeLayerSpec(map);
        layerSpecTemplates = {
            main: poiLikeLayerSpec,
            selected: {
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
            },
        };
    } else {
        // TODO: 'circle' config could take the icon properties from the poi layer as well (size, offsets, etc) and just try to make text bolder
        layerSpecTemplates = {
            main: placesLayerSpec,
            selected: selectedPlaceLayerSpec,
        };
    }

    return {
        main: withConfig(layerSpecTemplates.main, config, 'main'),
        selected: withConfig(layerSpecTemplates.selected, config, 'selected'),
        ...config?.layers?.additional,
    };
};
