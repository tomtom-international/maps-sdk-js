import { mapStyleLayerIDs } from '@tomtom-org/maps-sdk/map';
import type { GeoJSONSource, Map } from 'maplibre-gl';

export const initHoveredSourceAndLayers = (mapLibreMap: Map): GeoJSONSource => {
    const hoveredSourceID = 'hovered';
    mapLibreMap.addSource(hoveredSourceID, {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
    });
    mapLibreMap.addLayer(
        {
            id: 'hoveredLine',
            source: hoveredSourceID,
            type: 'line',
            paint: { 'line-color': 'brown', 'line-dasharray': [2, 1], 'line-width': 2 },
        },
        mapStyleLayerIDs.lowestLabel,
    );
    mapLibreMap.addLayer(
        {
            filter: ['==', ['get', 'category'], 'house'],
            id: 'hoveredPoint',
            source: hoveredSourceID,
            type: 'circle',
            paint: {
                'circle-stroke-color': 'grey',
                'circle-opacity': 0,
                'circle-stroke-width': 1,
                'circle-stroke-opacity': 1,
                'circle-radius': 15,
            },
        },
        mapStyleLayerIDs.lowestLabel,
    );

    return mapLibreMap.getSource(hoveredSourceID) as GeoJSONSource;
};

export const initSelectedSourceAndLayers = (mapLibreMap: Map): GeoJSONSource => {
    const selectedSourceID = 'selected';
    mapLibreMap.addSource(selectedSourceID, {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
    });
    mapLibreMap.addLayer({
        id: 'selectedBackground',
        source: selectedSourceID,
        type: 'fill',
        paint: { 'fill-color': 'black', 'fill-opacity': 0.25 },
    });

    return mapLibreMap.getSource(selectedSourceID) as GeoJSONSource;
};
