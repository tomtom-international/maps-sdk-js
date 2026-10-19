import {
    type BBox,
    bboxCenter,
    bboxFromCoordsArray,
    type PolygonFeature,
    type PolygonFeatures,
} from '@tomtom-org/maps-sdk/core';

type Zone = { name: string; deliveryFee: number; deliveryMinutes: number };

const zone = (properties: Zone, ring: [number, number][]): PolygonFeature => {
    const bbox = bboxFromCoordsArray(ring) as BBox;
    return {
        type: 'Feature',
        // A plain Polygon gets its center label only at a `placeCoordinates` point
        properties: { ...properties, placeCoordinates: bboxCenter(bbox) },
        bbox,
        geometry: { type: 'Polygon', coordinates: [ring] },
    };
};

// A delivery service's own zones in Barcelona, drawn along the streets of the Eixample grid
export const zones: PolygonFeatures = {
    type: 'FeatureCollection',
    features: [
        zone({ name: 'Eixample Esquerra', deliveryFee: 2.49, deliveryMinutes: 25 }, [
            [2.15629, 41.38069],
            [2.16871, 41.39003],
            [2.15967, 41.39683],
            [2.14726, 41.38749],
            [2.15629, 41.38069],
        ]),
        zone({ name: 'Eixample Dreta', deliveryFee: 1.99, deliveryMinutes: 20 }, [
            [2.16871, 41.39003],
            [2.17548, 41.39513],
            [2.16983, 41.39937],
            [2.15967, 41.39683],
            [2.16871, 41.39003],
        ]),
        zone({ name: 'Fort Pienc', deliveryFee: 2.99, deliveryMinutes: 30 }, [
            [2.17548, 41.39513],
            [2.18225, 41.40022],
            [2.17999, 41.40192],
            [2.16983, 41.39937],
            [2.17548, 41.39513],
        ]),
        zone({ name: 'Sagrada Família', deliveryFee: 2.99, deliveryMinutes: 30 }, [
            [2.16983, 41.39937],
            [2.17999, 41.40192],
            [2.17322, 41.40702],
            [2.16645, 41.40192],
            [2.16983, 41.39937],
        ]),
        zone({ name: 'Sant Antoni', deliveryFee: 3.49, deliveryMinutes: 35 }, [
            [2.15629, 41.38069],
            [2.16419, 41.38664],
            [2.16306, 41.37984],
            [2.16707, 41.37547],
            [2.16329, 41.37543],
            [2.15629, 41.38069],
        ]),
    ],
};
