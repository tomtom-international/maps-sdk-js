import type { Map as MapLibreMap } from 'maplibre-gl';

const EARTH_CIRCUMFERENCE_METERS = 2 * Math.PI * 6371008.8;
const METERS_PER_DEGREE = EARTH_CIRCUMFERENCE_METERS / 360;
const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

/**
 * Aims the camera at the ground under the middle of the screen, from where it stands, so the view stays the same.
 * MapLibre picks the detail of its tiles from the distance to the point aimed at: closing in on one high above
 * the streets would draw them in thousands of tiles.
 */
export const aimAtGround = (mapLibreMap: MapLibreMap): void => {
    const elevation = mapLibreMap.getCenterElevation();
    if (elevation === 0) return;

    const pitch = toRadians(mapLibreMap.getPitch());
    const bearing = toRadians(mapLibreMap.getBearing());
    const { lng, lat } = mapLibreMap.getCenter();
    const metersPerPixel = (EARTH_CIRCUMFERENCE_METERS * Math.cos(toRadians(lat))) / (512 * 2 ** mapLibreMap.getZoom());
    const pixelsToAim =
        mapLibreMap.getCanvas().clientHeight / 2 / Math.tan(toRadians(mapLibreMap.getVerticalFieldOfView()) / 2);
    const metersToAim = pixelsToAim * metersPerPixel;
    // The line of sight meets the ground this far past the point aimed at, and this much farther from the camera.
    const metersBeyond = elevation * Math.tan(pitch);
    const metersFarther = elevation / Math.cos(pitch);
    mapLibreMap.jumpTo({
        center: [
            lng + (metersBeyond * Math.sin(bearing)) / (METERS_PER_DEGREE * Math.cos(toRadians(lat))),
            lat + (metersBeyond * Math.cos(bearing)) / METERS_PER_DEGREE,
        ],
        elevation: 0,
        zoom: mapLibreMap.getZoom() - Math.log2((metersToAim + metersFarther) / metersToAim),
    });
};
