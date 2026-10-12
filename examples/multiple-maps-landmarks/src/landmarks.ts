/**
 * A landmark with an Orbis 3D model: where it stands, its height in metres, and the zoom and bearing
 * that show it whole on a 400-pixel map.
 */
export type Landmark = {
    name: string;
    city: string;
    center: [number, number];
    height: number;
    zoom: number;
    bearing: number;
};

/** One kind of landmark, four of them: one per map in the grid. */
export type LandmarkKind = { id: string; label: string; landmarks: readonly [Landmark, Landmark, Landmark, Landmark] };

export const landmarkKinds: readonly LandmarkKind[] = [
    {
        id: 'towers',
        label: 'Towers',
        landmarks: [
            { name: 'Eiffel Tower', city: 'Paris', center: [2.2945, 48.8584], height: 330, zoom: 15.4, bearing: -40 },
            {
                name: 'Space Needle',
                city: 'Seattle',
                center: [-122.3493, 47.6205],
                height: 184,
                zoom: 15.7,
                bearing: 0,
            },
            {
                name: 'Elizabeth Tower',
                city: 'London',
                center: [-0.1246, 51.5007],
                height: 96,
                zoom: 16.8,
                bearing: -100,
            },
            { name: 'Leaning Tower', city: 'Pisa', center: [10.3966, 43.723], height: 56, zoom: 17.4, bearing: 0 },
        ],
    },
    {
        id: 'cathedrals',
        label: 'Cathedrals',
        landmarks: [
            {
                name: 'Cologne Cathedral',
                city: 'Cologne',
                center: [6.9583, 50.9413],
                height: 157,
                zoom: 16.6,
                bearing: -20,
            },
            { name: 'Milan Cathedral', city: 'Milan', center: [9.1919, 45.4642], height: 108, zoom: 16.6, bearing: 0 },
            {
                name: 'Sagrada Família',
                city: 'Barcelona',
                center: [2.1744, 41.4036],
                height: 172,
                zoom: 16.6,
                bearing: 45,
            },
            { name: 'Notre-Dame', city: 'Paris', center: [2.3499, 48.853], height: 96, zoom: 16.6, bearing: -70 },
        ],
    },
    {
        id: 'stadiums',
        label: 'Stadiums',
        landmarks: [
            { name: 'Camp Nou', city: 'Barcelona', center: [2.1228, 41.3809], height: 50, zoom: 16.2, bearing: 0 },
            {
                name: 'Santiago Bernabéu',
                city: 'Madrid',
                center: [-3.6883, 40.4531],
                height: 70,
                zoom: 16.2,
                bearing: 0,
            },
            { name: 'Allianz Arena', city: 'Munich', center: [11.6247, 48.2188], height: 50, zoom: 16.2, bearing: 0 },
            { name: 'Wembley Stadium', city: 'London', center: [-0.2795, 51.556], height: 133, zoom: 16.2, bearing: 0 },
        ],
    },
    {
        id: 'monuments',
        label: 'Monuments',
        landmarks: [
            { name: 'Colosseum', city: 'Rome', center: [12.4922, 41.8902], height: 48, zoom: 16.8, bearing: 0 },
            { name: 'Arc de Triomphe', city: 'Paris', center: [2.295, 48.8738], height: 50, zoom: 17, bearing: 0 },
            {
                name: 'Brandenburg Gate',
                city: 'Berlin',
                center: [13.3777, 52.5163],
                height: 26,
                zoom: 17.6,
                bearing: -90,
            },
            {
                name: 'Statue of Liberty',
                city: 'New York',
                center: [-74.0445, 40.6892],
                height: 93,
                zoom: 16.8,
                bearing: 0,
            },
        ],
    },
];
