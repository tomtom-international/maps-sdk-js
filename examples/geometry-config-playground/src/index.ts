import type { Place } from '@tomtom-org/maps-sdk/core';
import { TomTomConfig } from '@tomtom-org/maps-sdk/core';
import { GeometriesModule, type StandardStyleID, TomTomMap } from '@tomtom-org/maps-sdk/map';
import { geocodeOne, geometryData } from '@tomtom-org/maps-sdk/services';
import type { LngLatBoundsLike } from 'maplibre-gl';
import './style.css';
import { API_KEY } from './config';
import { type GeometryStyleState, initControls } from './controls';

// (Set your own API key when working in your own environment)
TomTomConfig.instance.put({ apiKey: API_KEY, language: 'en-GB' });

// The city whose administrative boundary we style and position in the layer stack.
const CITY = 'Barcelona, Spain';
const INITIAL_STYLE: StandardStyleID = 'monoLight';

// Startup style: the fill slips below the road network and the line below the labels, so the
// independent fill/line positioning is obvious on load.
const state: GeometryStyleState = {
    fill: { color: '#2A5BD7', opacity: 0.35, beforeLayerConfig: 'lowestRoadLine' },
    line: { color: '#1B3A8C', width: 3, beforeLayerConfig: 'lowestLabel' },
};

(async () => {
    // Geocode first so the map can open directly on the city's bounding box — no initial camera jump.
    const place: Place = await geocodeOne(CITY);

    const map = new TomTomMap({
        style: INITIAL_STYLE,
        mapLibre: { container: 'sdk-map', bounds: place.bbox as LngLatBoundsLike },
    });

    const geometryModule = await GeometriesModule.get(map, { fill: { ...state.fill }, line: { ...state.line } });
    const geometries = await geometryData({ geometries: [place], zoom: 12 });
    await geometryModule.show(geometries);

    // Re-apply the whole config, then re-show. applyConfig repaints the border and repositions both
    // layers; show() re-bakes the fill color into the feature data (the fill layer reads its color
    // from a per-feature property, so a repaint alone won't move it).
    const apply = async () => {
        geometryModule.applyConfig({ fill: { ...state.fill }, line: { ...state.line } });
        await geometryModule.show(geometries);
    };

    initControls({
        state,
        initialStyle: INITIAL_STYLE,
        apply: () => void apply(),
        onStyleChange: (style) => map.setStyle(style),
    });
})();
