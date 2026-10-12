import { TomTomMap } from '@tomtom-org/maps-sdk/map';
import { Landmarks3D } from '@tomtom-org/maps-sdk-plugin-landmarks-3d';
import type { Landmark } from './landmarks';

const PITCH = 60;
// The map size each landmark's zoom is set for.
const REFERENCE_SIZE = 400;
// Where the landmarks and the base map's 3D buildings start.
const MIN_ZOOM = 15;

/** One map of the grid, showing one landmark at a time. */
export type LandmarkTile = { show: (landmark: Landmark) => void };

// Aims at the landmark's middle rather than its foot, so a tall one stands in the middle of its map.
// A map half the reference size needs one zoom level less to show it whole.
const cameraFor = (container: HTMLElement, { center, height, zoom, bearing }: Landmark) => {
    const sizeZoom = Math.log2(Math.min(container.clientWidth, container.clientHeight) / REFERENCE_SIZE);
    return { center, elevation: height / 2, zoom: Math.max(MIN_ZOOM, zoom + sizeZoom), bearing, pitch: PITCH };
};

const setCaption = (caption: HTMLElement, { name, city }: Landmark) => {
    const title = document.createElement('h3');
    title.textContent = name;
    const place = document.createElement('p');
    place.className = 'ui-note';
    place.textContent = city;
    caption.replaceChildren(title, place);
};

export const addLandmarkTile = (grid: HTMLElement, landmark: Landmark): LandmarkTile => {
    const tile = document.createElement('figure');
    tile.className = 'ui-map-tile';
    const container = document.createElement('div');
    container.className = 'ui-map-tile-map';
    const caption = document.createElement('figcaption');
    caption.className = 'ui-panel ui-panel-top-left ui-map-tile-label';
    tile.append(container, caption);
    grid.append(tile);

    // Without `centerClampedToGround: false`, MapLibre keeps the camera aimed at the ground.
    const map = new TomTomMap({
        mapLibre: { container, centerClampedToGround: false, ...cameraFor(container, landmark) },
    });
    new Landmarks3D(map);

    let current = landmark;
    setCaption(caption, current);
    // The grid reflows from two columns to four or to one, so the camera follows the map's new size.
    map.mapLibreMap.on('resize', () => map.mapLibreMap.jumpTo(cameraFor(container, current)));

    return {
        // A jump rather than a flight: MapLibre's animations leave the aim's elevation where it was.
        show: (next) => {
            current = next;
            setCaption(caption, next);
            map.mapLibreMap.jumpTo(cameraFor(container, next));
        },
    };
};
