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
 * A loop through a city, opening on its first landmark: the camera flies straight from the end of each
 * leg to the start of the next, soaring higher the further apart they are.
 */
export type Flyby = { label: string; legs: [LandmarkTurn, ...FlightLeg[]] };

export const flybys: Flyby[] = [
    {
        label: 'New York',
        legs: [
            {
                kind: 'landmark',
                label: 'Empire State Building',
                center: [-73.9857, 40.7484],
                heightMeters: 443,
                radiusMeters: 450,
                altitudeMeters: 320,
            },
            {
                kind: 'street',
                label: 'Sixth Avenue',
                path: [
                    [-73.984, 40.7546],
                    [-73.98, 40.76],
                    [-73.9767, 40.7655],
                ],
                altitudeMeters: [380, 160],
            },
            {
                kind: 'street',
                label: 'Fifth Avenue',
                path: [
                    [-73.973, 40.7644],
                    [-73.9768, 40.7587],
                    [-73.9817, 40.7532],
                ],
                altitudeMeters: [160, 240],
            },
        ],
    },
    {
        label: 'Las Vegas',
        legs: [
            {
                kind: 'landmark',
                label: 'Sphere',
                center: [-115.1619, 36.1208],
                heightMeters: 112,
                radiusMeters: 380,
                altitudeMeters: 220,
            },
            {
                kind: 'street',
                label: 'The Strip',
                path: [
                    [-115.1712, 36.1235],
                    [-115.1727, 36.1135],
                    [-115.1727, 36.1025],
                    [-115.1735, 36.0995],
                ],
                altitudeMeters: [260, 160],
            },
            {
                kind: 'landmark',
                label: 'Luxor',
                center: [-115.1761, 36.0955],
                heightMeters: 107,
                radiusMeters: 360,
                altitudeMeters: 300,
            },
        ],
    },
    {
        label: 'Paris',
        legs: [
            {
                kind: 'landmark',
                label: 'Eiffel Tower',
                center: [2.2945, 48.8583],
                heightMeters: 330,
                radiusMeters: 420,
                altitudeMeters: 300,
            },
            {
                kind: 'street',
                label: 'Avenue Kléber',
                path: [
                    [2.288, 48.8628],
                    [2.2918, 48.8686],
                    [2.2932, 48.8708],
                ],
                altitudeMeters: [260, 160],
            },
            {
                kind: 'landmark',
                label: 'Arc de Triomphe',
                center: [2.295, 48.8738],
                heightMeters: 50,
                radiusMeters: 200,
                altitudeMeters: 340,
            },
            {
                kind: 'street',
                label: 'Champs-Élysées',
                path: [
                    [2.299, 48.8722],
                    [2.3075, 48.8698],
                    [2.316, 48.8672],
                    [2.3212, 48.8656],
                ],
                altitudeMeters: [160, 200],
            },
            {
                kind: 'street',
                label: 'Along the Seine',
                path: [
                    [2.319, 48.8646],
                    [2.3125, 48.8642],
                    [2.3015, 48.864],
                ],
                altitudeMeters: [200, 160],
            },
        ],
    },
    {
        label: 'London',
        legs: [
            {
                kind: 'landmark',
                label: 'Palace of Westminster',
                center: [-0.1246, 51.4995],
                heightMeters: 96,
                radiusMeters: 320,
                altitudeMeters: 260,
            },
            {
                kind: 'landmark',
                label: 'London Eye',
                center: [-0.1196, 51.5033],
                heightMeters: 135,
                radiusMeters: 220,
                altitudeMeters: 370,
            },
            {
                kind: 'street',
                label: 'Whitehall',
                path: [
                    [-0.1228, 51.5045],
                    [-0.1262, 51.5046],
                    [-0.1272, 51.5068],
                    [-0.1285, 51.5078],
                ],
                altitudeMeters: [220, 160],
            },
            {
                kind: 'street',
                label: 'The Mall',
                path: [
                    [-0.13, 51.5065],
                    [-0.135, 51.5047],
                    [-0.1405, 51.5022],
                    [-0.139, 51.5005],
                    [-0.133, 51.5008],
                    [-0.129, 51.5007],
                ],
                altitudeMeters: [160, 240],
            },
        ],
    },
    {
        label: 'Singapore',
        legs: [
            {
                kind: 'landmark',
                label: 'Marina Bay Sands',
                center: [103.861, 1.2834],
                heightMeters: 200,
                radiusMeters: 380,
                altitudeMeters: 280,
            },
            {
                kind: 'landmark',
                label: 'Singapore Flyer',
                center: [103.8631, 1.2893],
                heightMeters: 165,
                radiusMeters: 260,
                altitudeMeters: 360,
            },
            {
                kind: 'landmark',
                label: 'Esplanade',
                center: [103.8555, 1.2898],
                heightMeters: 40,
                radiusMeters: 220,
                altitudeMeters: 330,
            },
            {
                kind: 'street',
                label: 'Collyer Quay',
                path: [
                    [103.854, 1.2873],
                    [103.8527, 1.2846],
                    [103.851, 1.281],
                ],
                altitudeMeters: [160, 240],
            },
        ],
    },
    {
        label: 'Barcelona',
        legs: [
            {
                kind: 'landmark',
                label: 'Sagrada Família',
                center: [2.1744, 41.4036],
                heightMeters: 172,
                radiusMeters: 380,
                altitudeMeters: 300,
            },
            {
                kind: 'street',
                label: 'Passeig de Gràcia',
                path: [
                    [2.17, 41.3872],
                    [2.1648, 41.3918],
                    [2.1621, 41.3952],
                    [2.1593, 41.3978],
                ],
                altitudeMeters: [240, 160],
            },
            {
                kind: 'street',
                label: 'Avinguda Diagonal',
                path: [
                    [2.1597, 41.3978],
                    [2.164, 41.3985],
                    [2.17, 41.4005],
                ],
                altitudeMeters: [160, 200],
            },
        ],
    },
    {
        label: 'Rome',
        legs: [
            {
                kind: 'landmark',
                label: 'Colosseum',
                center: [12.4922, 41.8902],
                heightMeters: 48,
                radiusMeters: 240,
                altitudeMeters: 320,
            },
            {
                kind: 'street',
                label: 'Via del Corso',
                path: [
                    [12.4797, 41.9025],
                    [12.4807, 41.9],
                    [12.4818, 41.8972],
                ],
                altitudeMeters: [220, 160],
            },
            {
                kind: 'landmark',
                label: 'Vittoriano',
                center: [12.4826, 41.8946],
                heightMeters: 81,
                radiusMeters: 220,
                altitudeMeters: 350,
            },
        ],
    },
    {
        label: 'Sydney',
        legs: [
            {
                kind: 'landmark',
                label: 'Sydney Opera House',
                center: [151.2149, -33.8572],
                heightMeters: 65,
                radiusMeters: 380,
                altitudeMeters: 220,
            },
            {
                kind: 'street',
                label: 'Macquarie Street',
                path: [
                    [151.2135, -33.8615],
                    [151.2129, -33.8642],
                    [151.2125, -33.8665],
                ],
                altitudeMeters: [240, 180],
            },
            {
                kind: 'landmark',
                label: 'Sydney Tower',
                center: [151.2093, -33.8705],
                heightMeters: 309,
                radiusMeters: 380,
                altitudeMeters: 300,
            },
        ],
    },
];
