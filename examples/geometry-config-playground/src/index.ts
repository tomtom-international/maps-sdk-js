import type { Place } from '@tomtom-org/maps-sdk/core';
import { TomTomConfig } from '@tomtom-org/maps-sdk/core';
import {
    GeometriesModule,
    type GeometriesModuleConfig,
    type StandardStyleID,
    TomTomMap,
} from '@tomtom-org/maps-sdk/map';
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
    fill: { style: 'filled', color: '#2A5BD7', opacity: 0.35 },
    line: { color: '#1B3A8C', width: 3 },
    beforeLayerConfig: { fill: 'lowestRoadLine', line: 'lowestLabel' },
    highlight: { fill: {}, line: {} },
};

const moduleConfig = (): GeometriesModuleConfig => ({
    fill: { ...state.fill },
    line: { ...state.line },
    beforeLayerConfig: { ...state.beforeLayerConfig },
    highlight: { fill: { ...state.highlight.fill }, line: { ...state.highlight.line } },
});

(async () => {
    // Geocode first so the map can open directly on the city's bounding box — no initial camera jump.
    const place: Place = await geocodeOne(CITY);

    const map = new TomTomMap({
        style: INITIAL_STYLE,
        mapLibre: { container: 'sdk-map', bounds: place.bbox as LngLatBoundsLike },
    });

    const geometryModule = await GeometriesModule.create(map, moduleConfig());
    const geometries = await geometryData({ geometries: [place], zoom: 12 });
    await geometryModule.show(geometries);

    // updateConfig restyles and repositions the geometries already shown, keeping the visibility the
    // panel's switch set and the click state the boundary is drawn in.
    initControls({
        state,
        initialStyle: INITIAL_STYLE,
        apply: () => geometryModule.updateConfig(moduleConfig()),
        onStyleChange: (style) => map.setStyle(style),
        onVisibleChange: (visible) => geometryModule.setVisible(visible),
        onClickedChange: (clicked) =>
            clicked ? geometryModule.setEventState({ index: 0, state: 'click' }) : geometryModule.clearEventStates(),
    });
})();
