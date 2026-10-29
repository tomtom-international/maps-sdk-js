import type { FlybyLook } from '../themes';

/**
 * A banked turn around a landmark, the camera glancing at it as it passes. The camera joins the circle on
 * the tangent from where the leg before ends, and leaves it on the tangent towards where the next one
 * starts, turning whichever way is shorter.
 */
export type LandmarkTurn = {
    kind: 'landmark';
    label: string;
    center: [number, number];
    heightMeters: number;
    radiusMeters: number;
    altitudeMeters: number;
    /** The ground the landmark stands on, metres above sea level, over the 3D terrain; 0 if left out. */
    groundMeters?: number;
};

/**
 * A flight down streets, sketched by a few points that the routing service snaps to the roads, diving or
 * climbing from the first altitude to the second.
 */
export type StreetRun = {
    kind: 'street';
    label: string;
    path: [number, number][];
    altitudeMeters: [from: number, to: number];
};

export type FlightLeg = LandmarkTurn | StreetRun;

/**
 * A loop through a city or over a landscape, opening on its first landmark: the camera flies straight from
 * the end of each leg to the start of the next, soaring higher the further apart they are. A landscape is
 * flown over the 3D terrain, its altitudes in metres above sea level, and `speedFactor` times faster, as its
 * turns are kilometres across.
 */
export type Flyby = {
    label: string;
    /** The look that shows the place at its best, by its label, which picking the place applies. */
    look: FlybyLook;
    legs: [LandmarkTurn, ...FlightLeg[]];
} & ({ group: 'Cities' } | { group: 'Landscapes'; speedFactor: number });

/** A landscape's turns are kilometres across, so it is flown faster than a city. */
export const speedFactorOf = (flyby: Flyby): number => (flyby.group === 'Landscapes' ? flyby.speedFactor : 1);
