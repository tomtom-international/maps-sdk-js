/** An origin or destination as `[longitude, latitude]`, the GeoJSON order the SDK takes. */
type RoutePoint = [number, number];

/** A route the picker can plan, labelled with the section type it is here to reach. */
export type PickableRoute = {
    label: string;
    locations: [RoutePoint, RoutePoint];
};

/**
 * Routes that between them carry all sixteen drawn section types.
 *
 * A type is only on the map when the route has stretches of it, so any single route leaves part of
 * the panel greyed out. Munich to Milan carries twelve of the sixteen; each route after it is the
 * only one here that reaches the type in its label.
 */
export const PICKABLE_ROUTES: readonly PickableRoute[] = [
    // The Alps for the tunnels, an Austrian vignette in the middle, a low-emission zone at either
    // end: everything except a ferry, a car train, a carpool lane and an unpaved stretch.
    {
        label: 'Munich → Milan',
        locations: [
            [11.582, 48.1351],
            [9.19, 45.4642],
        ],
    },
    // The Channel crossing, which the planner takes by boat rather than through the tunnel.
    {
        label: 'London → Paris (ferry)',
        locations: [
            [-0.1276, 51.5072],
            [2.3522, 48.8566],
        ],
    },
    // The Lötschberg, where the car is driven onto a rail wagon and carried through.
    {
        label: 'Kandersteg → Goppenstein (car train)',
        locations: [
            [7.6753, 46.4956],
            [7.7433, 46.3836],
        ],
    },
    // The HOV lanes on the Californian freeways.
    {
        label: 'Los Angeles → Riverside (carpool)',
        locations: [
            [-118.2437, 34.0522],
            [-117.3755, 33.9806],
        ],
    },
    // The gravel roads through the Namib.
    {
        label: 'Windhoek → Sossusvlei (unpaved)',
        locations: [
            [17.0832, -22.5609],
            [15.2875, -24.7333],
        ],
    },
];
