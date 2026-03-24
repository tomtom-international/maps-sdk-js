import type { DataDrivenPropertyValueSpecification, Map as MapLibreMap, SymbolLayerSpecification } from 'maplibre-gl';
import type { LayerSpecTemplate } from '../../shared';
import { isClickEventState } from '../../shared/layers/eventState';
import { ICON_ID, TITLE, pinLayerBaseSpec } from '../../shared/layers/symbolLayers';

/**
 * Replaces placeholders in text size spec with the actual title property.
 * @ignore
 */
export const getTextSizeSpec = (
    textSize?: DataDrivenPropertyValueSpecification<number>,
): DataDrivenPropertyValueSpecification<number> => {
    return JSON.parse(JSON.stringify(textSize)?.replaceAll('name', TITLE));
};

/**
 * Builds a POI-like layer spec that matches the base map style.
 * @ignore
 */
export const buildPoiLikeLayerSpec = (map: MapLibreMap): LayerSpecTemplate<SymbolLayerSpecification> => {
    const poiLayer = (map.getStyle().layers.find((layer) => layer.id === 'POI') as SymbolLayerSpecification) ?? {};
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
 * Builds a base layer spec for the 'circle' theme.
 * @ignore
 */
export const buildCircleBaseLayerSpec = (map: MapLibreMap): LayerSpecTemplate<SymbolLayerSpecification> => {
    const poiLayer = (map.getStyle().layers.find((layer) => layer.id === 'POI') as SymbolLayerSpecification) ?? {};
    const poiLayout = poiLayer.layout ?? {};
    return {
        ...pinLayerBaseSpec,
        layout: {
            ...pinLayerBaseSpec.layout,
            'icon-anchor': 'center',
            ...(poiLayout['icon-size'] !== undefined && { 'icon-size': poiLayout['icon-size'] }),
            ...(poiLayout['icon-padding'] !== undefined && { 'icon-padding': poiLayout['icon-padding'] }),
        },
        paint: {
            ...pinLayerBaseSpec.paint,
            'icon-translate': [0, 0],
        },
    };
};
