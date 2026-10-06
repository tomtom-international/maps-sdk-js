import type { WaypointLike } from '@tomtom-org/maps-sdk/core';
import { bboxFromGeoJSON, TomTomConfig } from '@tomtom-org/maps-sdk/core';
import { RoutingModule, TomTomMap } from '@tomtom-org/maps-sdk/map';
import { calculateRoute } from '@tomtom-org/maps-sdk/services';
import { API_KEY } from './config';
import './style.css';

TomTomConfig.instance.put({ apiKey: API_KEY, language: 'en-GB' });

// Four countries, four signs for the same fact. Nothing below configures the signs: the module
// posts them for every speed limit section it is given, and takes the face and the unit from the
// country each stretch runs through — which is why `country` is asked for alongside `speedLimit`.
type Tile = {
    country: string;
    note: string;
    /** Short on purpose: a handful of limit changes, at a zoom where a sign is legible. */
    waypoints: WaypointLike[];
};

const TILES: Tile[] = [
    {
        country: 'Netherlands',
        note: 'White disc, km/h',
        waypoints: [
            [4.9, 52.379],
            [4.764, 52.309],
        ],
    },
    {
        country: 'Sweden',
        note: 'Yellow disc, km/h — as the Nordics post it',
        waypoints: [
            [18.058, 59.331],
            [18.0, 59.362],
        ],
    },
    {
        country: 'United States',
        note: 'Plaque, mph — converted from the km/h the route reports',
        waypoints: [
            [-122.419, 37.775],
            [-122.447, 37.708],
        ],
    },
    {
        country: 'United Kingdom',
        note: 'Disc, mph — the same face, the other unit',
        waypoints: [
            [-0.127, 51.507],
            [-0.208, 51.465],
        ],
    },
];

const tileElement = (tile: Tile, index: number): HTMLElement => {
    const container = document.createElement('div');
    container.className = 'tile';
    container.innerHTML = `
        <div class="tile-map" id="tile-map-${index}"></div>
        <div class="tile-label">
            <span class="tile-country">${tile.country}</span>
            <span class="tile-note">${tile.note}</span>
        </div>`;
    return container;
};

/**
 * Resolves once this map has nothing left to draw. Checking `loaded()` first matters: a map that
 * went idle before the listener was attached would never fire `idle` again.
 */
const whenPainted = (map: TomTomMap): Promise<void> =>
    new Promise<void>((resolve) => {
        const mapLibreMap = map.mapLibreMap;
        const settle = () => {
            if (!mapLibreMap.loaded()) return;

            mapLibreMap.off('idle', settle);
            resolve();
        };

        mapLibreMap.on('idle', settle);
        settle();
    });

const showTile = async (tile: Tile, index: number): Promise<void> => {
    // `country` is what makes a sign local: without it the module has no country to take the face
    // and the unit from, and falls back to the configured display units.
    const routes = await calculateRoute({ locations: tile.waypoints, sectionTypes: ['speedLimit', 'country'] });

    const map = new TomTomMap({
        mapLibre: {
            container: `tile-map-${index}`,
            bounds: bboxFromGeoJSON(routes),
            fitBoundsOptions: { padding: 32 },
            interactive: false,
        },
    });

    // The tile is laid out by the grid, so the canvas takes its size from a box that may have been
    // measured before the row height resolved.
    map.mapLibreMap.resize();

    // No summary bubble and no waypoint pins: on a tile this size they would take the space the
    // signs need, and a sign gives way to every other route icon by default.
    const routingModule = await RoutingModule.create(map, { summaryBubbles: { visible: false } });
    await routingModule.showRoutes(routes);

    await whenPainted(map);
};

(async () => {
    const grid = document.querySelector('#ui-maps-container') as HTMLElement;
    TILES.forEach((tile, index) => grid.appendChild(tileElement(tile, index)));

    // Four independent routes, so four requests at once rather than one after another. A country
    // whose route fails leaves its own tile empty instead of taking the other three with it.
    await Promise.allSettled(TILES.map((tile, index) => showTile(tile, index)));

    // Every tile has drawn its last frame, which is what the e2e run waits for.
    grid.classList.add('ready');
})();
