import type { DataDrivenPropertyValueSpecification, Map as MapLibreMap, SymbolLayerSpecification } from 'maplibre-gl';
import type { LayerSpecTemplate } from '../../shared';
import { isClickEventState } from '../../shared/layers/eventState';
import { ICON_ID, TITLE } from '../../shared/layers/symbolLayers';

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
    const poiLayer = (map.getStyle().layers.find((layer) => layer.id === 'POI') as SymbolLayerSpecification) || {};
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
