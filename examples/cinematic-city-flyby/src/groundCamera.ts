import { type CameraOptions, LngLat, type Map as MapLibreMap } from 'maplibre-gl';
import type { FlightPath } from './flight';

// How slowly the map's centre follows the ground over the terrain: it closes most of the way in this long.
const GROUND_EASE_SECONDS = 1.5;
// The centre stays at least this far below the camera, where its view would otherwise meet the ground.
const MIN_CLEARANCE_METERS = 10;

/**
 * Over the terrain, MapLibre puts the map's centre on whichever slope the view meets, so its elevation,
 * and the zoom the camera's altitude gives with it, jump from one frame to the next. This eases that
 * elevation and slides the centre along the view, so the camera stays where the flight puts it.
 */
export const groundCamera = (mapLibreMap: MapLibreMap) => {
    let centerElevation: number | undefined;

    const optionsAt = (path: FlightPath, distance: number, seconds?: number): CameraOptions => {
        const { lngLat, altitude, bearing, pitch, roll } = path.cameraAt(distance);
        const options = mapLibreMap.calculateCameraOptionsFromCameraLngLatAltRotation(
            lngLat,
            altitude,
            bearing,
            pitch,
            roll,
        );
        if (!mapLibreMap.getTerrain() || !options.center) return options;

        const ground = mapLibreMap.queryTerrainElevation(options.center) ?? 0;
        const eased =
            seconds === undefined || centerElevation === undefined
                ? ground
                : centerElevation + (ground - centerElevation) * (1 - Math.exp(-seconds / GROUND_EASE_SECONDS));
        centerElevation = Math.min(eased, altitude - MIN_CLEARANCE_METERS);
        // The options hold the centre at the elevation the map has now: slide it along the view to the
        // eased one, and zoom by the distance it gained, so the camera stays where the flight puts it.
        const scale = (altitude - centerElevation) / (altitude - (options.elevation ?? 0));
        const center = LngLat.convert(options.center);
        return {
            ...options,
            center: new LngLat(
                lngLat[0] + (center.lng - lngLat[0]) * scale,
                lngLat[1] + (center.lat - lngLat[1]) * scale,
            ),
            zoom: (options.zoom ?? 0) - Math.log2(scale),
            elevation: centerElevation,
        };
    };

    // A city cut leaves a centre that a landscape raised. Drop it before the city camera is placed.
    const dropRaisedCentre = () => {
        if (mapLibreMap.getCenterElevation() === 0) return;
        centerElevation = undefined;
        mapLibreMap.setCenterElevation(0);
    };

    return { optionsAt, dropRaisedCentre };
};
