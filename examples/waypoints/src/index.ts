import { asSoftWaypoint, bboxFromGeoJSON, TomTomConfig } from '@cet/maps-sdk-js/core';
import { PlanningWaypoint, RoutingModule, TomTomMap } from '@cet/maps-sdk-js/map';
import { geocode } from '@cet/maps-sdk-js/services';
import { LngLatBoundsLike } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import './style.css';

// (Set your own API key when working in your own environment)
TomTomConfig.instance.put({ apiKey: process.env.API_KEY_EXAMPLES });

const waypointA = (await geocode({ query: 'Kensinton Road, London, UK', limit: 1 })).features[0];
const waypointB = (await geocode({ query: 'Vincent Square, London, UK', limit: 1 })).features[0];
const waypointC = (await geocode({ query: 'Bridge Street, London, UK', limit: 1 })).features[0];
const softWaypoint = asSoftWaypoint([-0.10507, 51.4879], 20);
const waypointD = (await geocode({ query: 'Roan Street, Greenwich, UK', limit: 1 })).features[0];
const allWaypoints = [waypointA, waypointB, softWaypoint, waypointC, waypointD];

const examples: Record<string, { title: string; waypoints: PlanningWaypoint[] }> = {
    all: { title: 'Show waypoints', waypoints: allWaypoints },
    allReversed: { title: 'Show reversed waypoints', waypoints: [...allWaypoints].reverse() },
    destination: { title: 'Show a waypoint as destination', waypoints: [null, waypointB] },
    origin: { title: 'Show a waypoint as origin', waypoints: [waypointC] },
    allExceptOrigin: {
        title: 'Show waypoints without origin',
        waypoints: [null, waypointB, softWaypoint, waypointC, waypointD],
    },
    allExceptDestination: {
        title: 'Show waypoints without destination',
        waypoints: [waypointA, waypointB, softWaypoint, waypointC, null],
    },
};

const map = new TomTomMap(
    {
        container: 'maps-sdk-js-examples-map-container',
        bounds: bboxFromGeoJSON(allWaypoints) as LngLatBoundsLike,
        fitBoundsOptions: { padding: 150 },
    },
    { style: 'monoLight' },
);

const examplesSelector = document.querySelector('#maps-sdk-js-examples-waypointExamples') as HTMLSelectElement;
for (const exampleKey in examples) {
    examplesSelector.add(new Option(examples[exampleKey].title, exampleKey));
}

const routingModule = await RoutingModule.get(map);
routingModule.showWaypoints(examples['all'].waypoints);
examplesSelector.addEventListener('change', (event) =>
    routingModule.showWaypoints(examples[(event.target as HTMLOptionElement).value].waypoints),
);
