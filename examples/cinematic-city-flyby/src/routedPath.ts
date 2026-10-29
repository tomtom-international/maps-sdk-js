import { calculateRoute } from '@tomtom-org/maps-sdk/services';
import { FlightPath } from './flight';
import { type Flyby, speedFactorOf } from './flybys';

// Each street run's sketch goes to the routing service as a path to follow, and comes back on the roads.
const routedStreets = async (flyby: Flyby): Promise<Map<number, [number, number][]>> => {
    const streets = new Map<number, [number, number][]>();
    await Promise.all(
        flyby.legs.map(async (leg, index) => {
            if (leg.kind !== 'street') return;

            try {
                const routes = await calculateRoute({ locations: [leg.path] });
                streets.set(
                    index,
                    routes.features[0].geometry.coordinates.map(([lng, lat]) => [lng, lat]),
                );
            } catch (error) {
                console.warn(`${leg.label} flies its sketch: the route failed.`, error);
            }
        }),
    );
    return streets;
};

const flightPaths = new Map<Flyby, Promise<FlightPath>>();

/** The fly-by's path on the roads, routed once and reused when the reader comes back to it. */
export const flightPathOf = (flyby: Flyby): Promise<FlightPath> => {
    let path = flightPaths.get(flyby);
    if (!path) {
        path = routedStreets(flyby).then((streets) => new FlightPath(flyby.legs, streets, speedFactorOf(flyby)));
        flightPaths.set(flyby, path);
    }
    return path;
};
