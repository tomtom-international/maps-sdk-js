import { type BBox, TomTomConfig } from '@tomtom-org/maps-sdk/core';
import { calculatePaddedBBox, calculatePaddedCenter, mapStyleLayerIDs, TomTomMap } from '@tomtom-org/maps-sdk/map';
import type { GeoJSONSource, Map } from 'maplibre-gl';
import './style.css';
import type { Position } from 'geojson';
import { API_KEY } from './config';

// (Set your own API key when working in your own environment)
TomTomConfig.instance.put({ apiKey: API_KEY, language: 'en-GB' });

(async () => {
    const map = new TomTomMap(
        {
            container: 'sdk-map',
            center: [4.3156, 52.3414],
            zoom: 8,
        },
        { style: 'monoLight' },
    );

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

    const BBOX_SOURCE_ID = 'padded-bbox-source';
    const BBOX_LAYER_ID = 'padded-bbox-layer';
    const CENTER_SOURCE_ID = 'center-x-source';
    const CENTER_LAYER_ID = 'center-x-layer';

    const createCenterPoint = (center: Position) => {
        return {
            type: 'Feature' as const,
            geometry: {
                type: 'Point' as const,
                coordinates: center,
            },
            properties: {},
        };
    };

    const updateBBoxVisualization = () => {
        const bbox = calculatePaddedBBox({ map, surroundingElements, paddingPX: 20 });
        if (!bbox) return;

        const bboxSource = mapLibreMap.getSource(BBOX_SOURCE_ID) as GeoJSONSource;
        bboxSource.setData(createBBoxPolygon(bbox));

        const center = calculatePaddedCenter({ map, surroundingElements });
        if (center) {
            const centerSource = mapLibreMap.getSource(CENTER_SOURCE_ID) as GeoJSONSource;
            centerSource.setData(createCenterPoint(center));
        }
    };

    mapLibreMap.addSource(BBOX_SOURCE_ID, {
        type: 'geojson',
        data: { type: 'Feature', geometry: { type: 'Polygon', coordinates: [[]] }, properties: {} },
    });

    mapLibreMap.addLayer(
        {
            id: BBOX_LAYER_ID,
            type: 'fill',
            source: BBOX_SOURCE_ID,
            paint: { 'fill-color': 'red', 'fill-opacity': 0.2 },
        },
        mapStyleLayerIDs.lowestRoadLine,
    );

    mapLibreMap.addSource(CENTER_SOURCE_ID, {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
    });

    mapLibreMap.addLayer(
        {
            id: CENTER_LAYER_ID,
            type: 'symbol',
            source: CENTER_SOURCE_ID,
            layout: {
                'text-field': 'x',
                'text-size': 96,
                'text-allow-overlap': true,
            },
        },
        mapStyleLayerIDs.lowestRoadLine,
    );

    updateBBoxVisualization();

    mapLibreMap.on('moveend', updateBBoxVisualization);
    mapLibreMap.on('resize', updateBBoxVisualization);
})();
