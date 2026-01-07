import { type BBox, TomTomConfig } from '@tomtom-org/maps-sdk/core';
import { calculateFittingBBox, TomTomMap } from '@tomtom-org/maps-sdk/map';
import type { GeoJSONSource, Map } from 'maplibre-gl';
import './style.css';
import { API_KEY } from './config';

// (Set your own API key when working in your own environment)
TomTomConfig.instance.put({ apiKey: API_KEY, language: 'en-GB' });

const toBeContainedBBox: BBox = [4.8, 52.3, 4.95, 52.4];

(async () => {
    const map = new TomTomMap({ container: 'sdk-map', bounds: toBeContainedBBox, zoom: 8 }, { style: 'monoLight' });
    const mapLibreMap: Map = map.mapLibreMap;
    await mapLibreMap.once('load');

    const panelLeft = document.getElementById('panel-left');
    const panelTop = document.getElementById('panel-top');
    const panelRight = document.getElementById('panel-right');

    const surroundingElements = [panelLeft, panelTop, panelRight] as HTMLElement[];

    const createBBoxPolygon = (bbox: BBox) => {
        const [west, south, east, north] = bbox;
        return {
            type: 'Feature' as const,
            geometry: {
                type: 'Polygon' as const,
                coordinates: [
                    [
                        [west, south],
                        [east, south],
                        [east, north],
                        [west, north],
                        [west, south],
                    ],
                ],
            },
            properties: {},
        };
    };

    const TO_BE_CONTAINED_SOURCE_ID = 'to-be-contained-bbox-source';
    const EXPANDED_BBOX_SOURCE_ID = 'expanded-bbox-source';

    const updateBBoxVisualization = () => {
        // Calculate the expanded bbox that will contain the "toBeContainedBBox"
        // while accounting for the surrounding UI elements
        const expandedBBox = calculateFittingBBox({
            map,
            toBeContainedBBox,
            surroundingElements,
            paddingPX: 20,
        });
        if (!expandedBBox) return;

        const expandedBBoxSource = mapLibreMap.getSource(EXPANDED_BBOX_SOURCE_ID) as GeoJSONSource;
        expandedBBoxSource.setData(createBBoxPolygon(expandedBBox));
        mapLibreMap.fitBounds(expandedBBox);
    };

    // Add source and layer for the expanded bbox (red)
    mapLibreMap.addSource(EXPANDED_BBOX_SOURCE_ID, {
        type: 'geojson',
        data: { type: 'Feature', geometry: { type: 'Polygon', coordinates: [[]] }, properties: {} },
    });

    mapLibreMap.addLayer({
        id: 'expanded-bbox-layer',
        type: 'fill',
        source: EXPANDED_BBOX_SOURCE_ID,
        paint: { 'fill-color': 'red', 'fill-opacity': 0.1 },
    });

    // Add source and layer for the "to be contained" bbox (blue)
    mapLibreMap.addSource(TO_BE_CONTAINED_SOURCE_ID, {
        type: 'geojson',
        data: createBBoxPolygon(toBeContainedBBox),
    });

    mapLibreMap.addLayer({
        id: 'to-be-contained-bbox-layer',
        type: 'fill',
        source: TO_BE_CONTAINED_SOURCE_ID,
        paint: { 'fill-color': 'blue', 'fill-opacity': 0.2 },
    });

    updateBBoxVisualization();

    mapLibreMap.on('resize', updateBBoxVisualization);
})();
