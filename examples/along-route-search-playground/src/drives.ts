import { BBox, bboxFromGeoJSON, type Route, type Routes, type Waypoint } from '@tomtom-org/maps-sdk/core';
import { calculateFittingBBox, type RoutingModule, type TomTomMap } from '@tomtom-org/maps-sdk/map';
import { calculateRoute, geocodeOne } from '@tomtom-org/maps-sdk/services';

/**
 * Long drives through cities, so a search has places to find. Together they
 * cover a Channel car train, a Baltic ferry, Alpine tunnels, a French toll
 * motorway and a Californian carpool lane.
 */
export const demoRoutes = [
    { id: 'london-paris', label: 'London to Paris', queries: ['London, United Kingdom', 'Paris, France'] },
    {
        id: 'copenhagen-hamburg',
        label: 'Copenhagen to Hamburg',
        queries: ['Copenhagen, Denmark', 'Hamburg, Germany'],
    },
    { id: 'munich-milan', label: 'Munich to Milan', queries: ['Munich, Germany', 'Milan, Italy'] },
    { id: 'paris-lyon', label: 'Paris to Lyon', queries: ['Paris, France', 'Lyon, France'] },
    {
        id: 'los-angeles-las-vegas',
        label: 'Los Angeles to Las Vegas',
        queries: ['Los Angeles, California', 'Las Vegas, Nevada'],
    },
] as const;

export type DemoRouteId = (typeof demoRoutes)[number]['id'];

export const demoRoute = (id: DemoRouteId) => {
    const found = demoRoutes.find((route) => route.id === id);
    if (!found) throw new Error(`Unknown route ${id}`);
    return found;
};

export type PlannedDrive = {
    waypoints: Waypoint[];
    routes: Routes;
    route: Route;
};

/** Plans the drive on historical traffic, so the road is the typical one. */
export const planDrive = async (queries: readonly string[], signal: AbortSignal): Promise<PlannedDrive> => {
    const waypoints = await Promise.all(queries.map((query) => geocodeOne({ query, signal })));
    const routes = await calculateRoute({
        locations: waypoints,
        costModel: { traffic: 'historical' },
        signal,
    });
    const route = routes.features[0];
    if (!route) throw new Error('The route came back empty.');
    return { waypoints, routes, route };
};

/** Fits the geometry into the map area the panel leaves free. */
export const fitInView = (map: TomTomMap, geometry: Parameters<typeof bboxFromGeoJSON>[0]) => {
    const box = bboxFromGeoJSON(geometry) as BBox;
    const fittingBBox = calculateFittingBBox({
        map,
        toBeContainedBBox: box,
        surroundingElements: ['.ui-customPanel'],
        paddingPX: 40,
    });
    if (fittingBBox) map.mapLibreMap.fitBounds(fittingBBox);
};

/** Paints drives in the order they were asked for, so a slow answer cannot cover a later one. */
export const createDrivePainter = (routingModule: RoutingModule, map: TomTomMap, onShown: (route: Route) => void) => {
    let paintOrder = Promise.resolve();

    return (planned: PlannedDrive) => {
        const turn = paintOrder.then(async () => {
            await routingModule.showWaypoints(planned.waypoints);
            await routingModule.showRoutes(planned.routes);
            fitInView(map, planned.route);
            onShown(planned.route);
        });
        paintOrder = turn.then(
            () => undefined,
            () => undefined,
        );
        return turn;
    };
};
