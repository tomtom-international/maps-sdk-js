import { asSoftWaypoint, bboxFromGeoJSON, TomTomConfig } from '@tomtom-org/maps-sdk/core';
import { PlanningWaypoint, RoutingModule, TomTomMap } from '@tomtom-org/maps-sdk/map';
import { geocodeOne } from '@tomtom-org/maps-sdk/services';
import type { LngLatBoundsLike } from 'maplibre-gl';
import './style.css';

// (Set your own API key when working in your own environment)
TomTomConfig.instance.put({ apiKey: process.env.API_KEY_EXAMPLES });

(async () => {
    const waypointA = await geocodeOne('Kensinton Road, London, UK');
    const waypointB = await geocodeOne('Vincent Square, London, UK');
    const waypointC = await geocodeOne('Bridge Street, London, UK');
    const softWaypoint = asSoftWaypoint([-0.10507, 51.4879], 20);
    const waypointD = await geocodeOne('Roan Street, Greenwich, UK');
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
            container: 'sdk-map',
            bounds: bboxFromGeoJSON(allWaypoints) as LngLatBoundsLike,
            fitBoundsOptions: { padding: 150 },
        },
        { style: 'monoLight' },
    );

    const examplesSelector = document.querySelector('#sdk-example-waypointExamples') as HTMLSelectElement;
    for (const exampleKey in examples) {
        examplesSelector.add(new Option(examples[exampleKey].title, exampleKey));
    }

    const routingModule = await RoutingModule.get(map);
    routingModule.showWaypoints(examples['all'].waypoints);
    examplesSelector.addEventListener('change', (event) =>
        routingModule.showWaypoints(examples[(event.target as HTMLOptionElement).value].waypoints),
    );
})();
