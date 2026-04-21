import { omit } from 'lodash-es';
import type { DataDrivenPropertyValueSpecification, Map as MapLibreMap, SymbolLayerSpecification } from 'maplibre-gl';
import type { LayerSpecTemplate } from '../../shared';
import { isClickEventState } from '../../shared/layers/eventState';
import { ICON_ID, pinLayerBaseSpec, TITLE } from '../../shared/layers/symbolLayers';

/**
 * Replaces placeholders in text size spec with the actual title property.
 * @ignore
 */
export const getTextSizeSpec = (
    textSize?: DataDrivenPropertyValueSpecification<number>,
): DataDrivenPropertyValueSpecification<number> => {
    return JSON.parse(JSON.stringify(textSize)?.replaceAll('name', TITLE));
};

const findStyleLayer = (map: MapLibreMap, layerID: string): SymbolLayerSpecification =>
    (map.getStyle().layers.find((layer) => layer.id === layerID) as SymbolLayerSpecification) ?? {};

// Shared foundation for every POI-like layer variant: filter, symbol type, and
// paint/layout props copied verbatim from the base map style layer so the style's
// original expressions (e.g., text-color keyed on `category`/`group`) keep working
// against our GeoJSON features. We strip inherited `visibility` because some styles
// hide `POI - Micro` by default — our places layer owns visibility via
// `PlacesModule.applyPlacesVisibility` and must not carry the style's hidden state.
const buildBaseMapPOILayerFoundation = (
    poiLayer: SymbolLayerSpecification,
): LayerSpecTemplate<SymbolLayerSpecification> => ({
    filter: ['!', isClickEventState],
    type: 'symbol',
    paint: poiLayer.paint,
    layout: poiLayer.layout ? omit(poiLayer.layout, 'visibility') : undefined,
});

/**
 * Builds a POI-like layer spec that mirrors the base map style's 'POI' layer,
 * overriding the icon image (bound to our `iconID` feature prop) and text field
 * so custom category icons and titles take effect. Paint and remaining layout
 * props — notably `text-color`, which reads `['get','category']`/`['get','group']`
 * — are inherited verbatim from the style.
 * @ignore
 */
export const buildBaseMapPOILayerSpec = (map: MapLibreMap): LayerSpecTemplate<SymbolLayerSpecification> => {
    const foundation = buildBaseMapPOILayerFoundation(findStyleLayer(map, 'POI'));
    const textSize = foundation.layout?.['text-size'];
    return {
        ...foundation,
        layout: {
            ...foundation.layout,
            'icon-image': ['get', ICON_ID],
            'text-field': ['get', TITLE],
            ...(textSize && { 'text-size': getTextSizeSpec(textSize) }),
        },
    };
};

// Builds a POI-like layer spec that mirrors the base map style's 'POI - Micro' layer.
// Inherits the style's `['get','group']`-driven `icon-image` verbatim — custom
// `PlaceIconConfig.categoryIcons` icons only apply on the `main` layer. Three
// style-carried properties would otherwise suppress rendering:
//   - `minzoom: 15.5` and `icon-opacity` zoom-interp starting at 0 below 15.5 — our places
//     should show at all zooms, so we drop the zoom gate and force opacity to 1;
//   - collision culling against the `main` POI layer above — bypassed via
//     `icon-allow-overlap` + `icon-ignore-placement`.
export const buildPOIMicroLikeLayerSpec = (map: MapLibreMap): LayerSpecTemplate<SymbolLayerSpecification> => {
    const foundation = buildBaseMapPOILayerFoundation(findStyleLayer(map, 'POI - Micro'));
    return {
        ...foundation,
        minzoom: 0,
        layout: {
            ...foundation.layout,
            'icon-allow-overlap': true,
            'icon-ignore-placement': true,
        },
        paint: {
            ...foundation.paint,
            'icon-opacity': 1,
        },
    };
};

/**
 * Builds a base layer spec for the 'circle-icon' theme.
 * @ignore
 */
export const buildCircleBaseLayerSpec = (map: MapLibreMap): LayerSpecTemplate<SymbolLayerSpecification> => {
    const poiLayout = findStyleLayer(map, 'POI').layout ?? {};
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
