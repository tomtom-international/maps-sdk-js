import type { Route } from '@tomtom-org/maps-sdk/core';
import type { TomTomMap } from '@tomtom-org/maps-sdk/map';
import { anchorForPitch, RouteFlyover, type RouteFlyoverOptions } from '@tomtom-org/maps-sdk-plugin-flyover';
import { MapEffects } from '@tomtom-org/maps-sdk-plugin-map-effects';
import { lendCamera, reclaimCamera } from './cameraHolder';
import { anchorBetweenPanels, easeToTopView } from './coveringPanels';

// The drive flies in this long, whatever its length.
const FLIGHT_SECONDS = 60;
// Tilted to read the relief and the road ahead, for the flight only.
const PITCH = 60;
// At replay pace the next junction is a split second away: the camera looks this far down the road
// instead, so it turns with the road rather than at every exit.
const AIM_SECONDS = 3;
// A thin band around the marker stays sharp, and the road ahead and behind it softens.
const DEPTH_OF_FIELD = { intensity: 18, band: 0.1, bokeh: 0.6 } as const;

type FlightCallbacks = Required<Pick<RouteFlyoverOptions, 'onProgress'>> & {
    /** Called once the flight has landed, at the destination or wherever it was taken off the camera. */
    onLand: () => void;
};

/**
 * Flies the camera down the route from `fromSeconds` into the trip, the ground out of focus beyond
 * the marker it follows. The stays are flown through. The flight holds the camera until it arrives,
 * the map is pressed, or {@link reclaimCamera}, and lands back in the top view.
 */
export const flyRoute = (
    map: TomTomMap,
    route: Route,
    fromSeconds: number,
    { onProgress, onLand }: FlightCallbacks,
) => {
    reclaimCamera();
    const { mapLibreMap } = map;
    const metersPerSecond = route.properties.summary.lengthInMeters / FLIGHT_SECONDS;
    const anchor = anchorBetweenPanels(map, anchorForPitch(PITCH));
    const flyover = new RouteFlyover(map, {
        route,
        loop: false,
        camera: {
            speedKMH: metersPerSecond * 3.6,
            pitch: PITCH,
            aim: { mode: 'distance', metersAhead: metersPerSecond * AIM_SECONDS },
            // A city trip flies slowly, and so close; past about 12 km, the plugin's widest zoom.
            zoom: { mode: 'speed' },
            anchor,
        },
        onProgress,
        onArrive: reclaimCamera,
    });
    // The plane of focus sits on the marker. Focus counts up the frame from its bottom edge, and the
    // anchor down it from the top.
    const effects = new MapEffects(map, { depthOfField: { ...DEPTH_OF_FIELD, focus: 1 - anchor.y } });

    // Each frame of the flight stops MapLibre's gestures, so the press that would start one lands it
    // instead. The top view waits for the press to end, or be cancelled, rather than fight the move
    // the user makes.
    const pressTarget = mapLibreMap.getCanvasContainer();
    let pressed = false;
    const landOnPress = () => {
        pressed = true;
        reclaimCamera();
    };
    const easeOnRelease = () => {
        window.removeEventListener('pointerup', easeOnRelease);
        window.removeEventListener('pointercancel', easeOnRelease);
        easeToTopView(map);
    };
    lendCamera(() => {
        pressTarget.removeEventListener('pointerdown', landOnPress);
        flyover.remove();
        effects.remove();
        if (pressed) {
            window.addEventListener('pointerup', easeOnRelease);
            window.addEventListener('pointercancel', easeOnRelease);
        } else {
            easeToTopView(map);
        }
        onLand();
    });
    pressTarget.addEventListener('pointerdown', landOnPress);
    flyover.seek({ traveledTimeInSeconds: fromSeconds });
    flyover.start();
};
