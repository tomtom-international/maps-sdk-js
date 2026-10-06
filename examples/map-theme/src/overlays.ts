import type { Place, PolygonFeatures } from '@tomtom-org/maps-sdk/core';

// An area drawn on top of the map: the SDK's own layers, not the style's.
export const ileDeLaCite: PolygonFeatures = {
    type: 'FeatureCollection',
    features: [
        {
            type: 'Feature',
            properties: { title: 'Île de la Cité' },
            bbox: [2.3397, 48.8513, 2.3535, 48.8581],
            geometry: {
                type: 'Polygon',
                coordinates: [
                    [
                        [2.3397, 48.8574],
                        [2.3414, 48.8581],
                        [2.3452, 48.857],
                        [2.348, 48.8561],
                        [2.3508, 48.8548],
                        [2.3524, 48.853],
                        [2.3535, 48.8515],
                        [2.351, 48.8513],
                        [2.3478, 48.8525],
                        [2.3445, 48.8543],
                        [2.3418, 48.856],
                        [2.3397, 48.8574],
                    ],
                ],
            },
        },
    ],
};

const landmark = (name: string, position: [longitude: number, latitude: number]): Place => ({
    type: 'Feature',
    id: name,
    geometry: { type: 'Point', coordinates: position },
    properties: { type: 'POI', address: { freeformAddress: name } },
});

// The route runs between two of the pins.
export const louvre = landmark('Louvre', [2.3376, 48.8606]);
export const pantheon = landmark('Panthéon', [2.3464, 48.8462]);

// Three places, drawn by the SDK's own pin layer, not the style's.
export const landmarks: Place[] = [landmark('Notre-Dame', [2.3499, 48.853]), louvre, pantheon];
