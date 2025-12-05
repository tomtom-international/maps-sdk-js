import type { FeatureCollection } from 'geojson';
import { describe, expect, test } from 'vitest';
import type { RouteSections } from '../../types/routeSections';
import { toDisplayTrafficSectionProps } from '../displayTrafficSectionProps';
import { toDisplayRouteSections } from '../routeSections';
import { rebuildFeaturesWithRouteSelection } from '../routeSelection';
import { dummyRoutesWithSectionsData } from './data/dummyRoutesWithSections.data';
import { rebuildSectionsWithSelectionData } from './data/rebuildSectionsWithSelection.data';

const TEST_ROUTES = dummyRoutesWithSectionsData;

const EMPTY_FEATURE_COLLECTION: FeatureCollection = { type: 'FeatureCollection', features: [] };

const TEST_ID = '123';

describe('Tests about building route sections', () => {
    test('Build route sections', () => {
        expect(toDisplayRouteSections(TEST_ROUTES, 'carTrain')).toEqual(EMPTY_FEATURE_COLLECTION);
        expect(toDisplayRouteSections(TEST_ROUTES, 'carTrain22' as never)).toEqual(EMPTY_FEATURE_COLLECTION);
        expect(toDisplayRouteSections(TEST_ROUTES, 'ferry')).toEqual({
            type: 'FeatureCollection',
            features: [
                {
                    type: 'Feature',
                    geometry: {
                        type: 'LineString',
                        coordinates: [
                            [0, 1],
                            [0, 2],
                            [0, 3],
                        ],
                    },
                    id: expect.any(String),
                    properties: {
                        id: expect.any(String),
                        startPointIndex: 1,
                        endPointIndex: 3,
                        routeIndex: 0,
                        routeState: 'selected',
                    },
                },
                {
                    type: 'Feature',
                    geometry: {
                        type: 'LineString',
                        coordinates: [
                            [1, 2],
                            [1, 3],
                        ],
                    },
                    id: TEST_ID,
                    properties: {
                        id: TEST_ID,
                        startPointIndex: 2,
                        endPointIndex: 3,
                        routeIndex: 1,
                        routeState: 'deselected',
                    },
                },
            ],
        });

        // Traffic sections as-is:
        expect(toDisplayRouteSections(TEST_ROUTES, 'traffic')).toEqual({
            type: 'FeatureCollection',
            features: [
                {
                    type: 'Feature',
                    geometry: {
                        type: 'LineString',
                        coordinates: [
                            [1, 3],
                            [1, 4],
                            [1, 5],
                        ],
                    },
                    id: TEST_ID,
                    properties: {
                        id: TEST_ID,
                        startPointIndex: 3,
                        endPointIndex: 5,
                        categories: ['rain'],
                        magnitudeOfDelay: 'moderate',
                        delayInSeconds: 350,
                        tec: { causes: [{ mainCauseCode: 19 }] },
                        routeIndex: 1,
                        routeState: 'deselected',
                    },
                },
            ],
        });

        // Traffic section, passing its display props function:
        expect(toDisplayRouteSections(TEST_ROUTES, 'traffic', toDisplayTrafficSectionProps)).toEqual({
            type: 'FeatureCollection',
            features: [
                {
                    type: 'Feature',
                    geometry: {
                        type: 'LineString',
                        coordinates: [
                            [1, 3],
                            [1, 4],
                            [1, 5],
                        ],
                    },
                    id: TEST_ID,
                    properties: {
                        id: TEST_ID,
                        startPointIndex: 3,
                        endPointIndex: 5,
                        magnitudeOfDelay: 'moderate',
                        categories: ['rain'],
                        delayInSeconds: 350,
                        tec: { causes: [{ mainCauseCode: 19 }] },
                        causeIconID: 'traffic-incidents-rain',
                        routeIndex: 1,
                        routeState: 'deselected',
                    },
                },
            ],
        });
    });

    test.each(
        rebuildSectionsWithSelectionData,
    )('%s', (_name: string, inputSections: RouteSections, expectedSections: RouteSections) => {
        expect(rebuildFeaturesWithRouteSelection(TEST_ROUTES, inputSections)).toEqual(expectedSections);
    });
});
