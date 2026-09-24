import type { CountrySectionProps, Routes } from '@tomtom-org/maps-sdk/core';
import type { MapGeoJSONFeature } from 'maplibre-gl';
import { describe, expect, test } from 'vitest';
import type { DisplayRouteProps } from '../../types/displayRoutes';
import { toCountryCrossingEventFeature, toDisplayCountryCrossings } from '../countryCrossings';

const country = (countryCodeISO2: string, startPointIndex: number, endPointIndex: number): CountrySectionProps =>
    ({
        id: `country-${countryCodeISO2}-${startPointIndex}`,
        startPointIndex,
        endPointIndex,
        countryCodeISO2,
    }) as CountrySectionProps;

// A straight west-to-east line, so a crossing's coordinate says which point index it came from.
const STRAIGHT_LINE = Array.from({ length: 10 }, (_unused, index) => [index, 0]);

const routeCrossing = (countries: CountrySectionProps[], coordinates = STRAIGHT_LINE): Routes<DisplayRouteProps> =>
    ({
        type: 'FeatureCollection',
        features: [
            {
                type: 'Feature',
                geometry: { type: 'LineString', coordinates },
                properties: { index: 0, routeState: 'selected', sections: { country: countries } },
            },
        ],
    }) as unknown as Routes<DisplayRouteProps>;

const labelsOf = (routes: Routes<DisplayRouteProps>) =>
    toDisplayCountryCrossings(routes).features.map((feature) => feature.properties.label);

describe('the border crossings along a route', () => {
    test('a crossing is the seam between two country sections, at the point the second begins', () => {
        const crossings = toDisplayCountryCrossings(routeCrossing([country('ES', 0, 4), country('FR', 5, 9)]));

        expect(crossings.features).toHaveLength(1);
        expect(crossings.features[0].properties.label).toBe('ES → FR');
        expect(crossings.features[0].properties.fromCountryCode).toBe('ES');
        expect(crossings.features[0].properties.toCountryCode).toBe('FR');
        // The seam is where the entered country starts, not where the departed one ended.
        expect(crossings.features[0].geometry.coordinates).toEqual([5, 0]);
    });

    test('a route inside one country has no crossing, however long it is', () => {
        expect(labelsOf(routeCrossing([country('NL', 0, 9)]))).toEqual([]);
    });

    test('a route that was never asked for its country sections shows nothing', () => {
        const withoutCountries = {
            type: 'FeatureCollection',
            features: [
                {
                    type: 'Feature',
                    geometry: { type: 'LineString', coordinates: STRAIGHT_LINE },
                    properties: { index: 0, routeState: 'selected', sections: {} },
                },
            ],
        } as unknown as Routes<DisplayRouteProps>;

        expect(labelsOf(withoutCountries)).toEqual([]);
    });

    test('three countries give two crossings, each naming the pair it joins', () => {
        expect(labelsOf(routeCrossing([country('ES', 0, 3), country('FR', 4, 6), country('BE', 7, 9)]))).toEqual([
            'ES → FR',
            'FR → BE',
        ]);
    });

    test('re-entering a country is a second crossing, back the way it came', () => {
        expect(labelsOf(routeCrossing([country('FR', 0, 3), country('CH', 4, 6), country('FR', 7, 9)]))).toEqual([
            'FR → CH',
            'CH → FR',
        ]);
    });

    test('sections arriving out of order still read in the direction of travel', () => {
        // Pairing on array order alone would report `FR → ES`, a crossing that runs backwards.
        expect(labelsOf(routeCrossing([country('FR', 5, 9), country('ES', 0, 4)]))).toEqual(['ES → FR']);
    });

    test('a section starting past the end of the geometry is skipped rather than placed at nowhere', () => {
        const shortGeometry = [
            [0, 0],
            [1, 0],
        ];

        expect(labelsOf(routeCrossing([country('ES', 0, 1), country('FR', 5, 9)], shortGeometry))).toEqual([]);
    });

    test('each crossing carries the route it belongs to, so a selection change can restyle it', () => {
        const crossings = toDisplayCountryCrossings(routeCrossing([country('ES', 0, 4), country('FR', 5, 9)]));

        expect(crossings.features[0].properties.routeIndex).toBe(0);
        expect(crossings.features[0].properties.routeState).toBe('selected');
    });

    test('the bearing is the direction of travel through the seam, not out of it', () => {
        // STRAIGHT_LINE runs due east, so every crossing on it reads 90.
        const crossings = toDisplayCountryCrossings(routeCrossing([country('ES', 0, 4), country('FR', 5, 9)]));

        expect(crossings.features[0].properties.bearing).toBeCloseTo(90, 0);
    });

    test('a route running north reads a bearing of 0, whichever way the sections were listed', () => {
        const northbound = Array.from({ length: 10 }, (_unused, index) => [0, index]);
        const crossings = toDisplayCountryCrossings(
            routeCrossing([country('FR', 5, 9), country('ES', 0, 4)], northbound),
        );

        expect(crossings.features[0].properties.bearing).toBeCloseTo(0, 0);
    });

    test('each crossing names the two sections it joins, so a click can resolve them', () => {
        const crossings = toDisplayCountryCrossings(routeCrossing([country('ES', 0, 4), country('FR', 5, 9)]));

        expect(crossings.features[0].properties.fromSectionStartPointIndex).toBe(0);
        expect(crossings.features[0].properties.toSectionStartPointIndex).toBe(5);
    });
});

describe('a clicked border crossing', () => {
    const routes = routeCrossing([country('FR', 0, 3), country('CH', 4, 6), country('FR', 7, 9)]);
    const [firstCrossing] = toDisplayCountryCrossings(routes).features;
    const clicked = { ...firstCrossing, id: firstCrossing.id } as unknown as MapGeoJSONFeature;

    test('resolves both country sections off the route it belongs to', () => {
        const event = toCountryCrossingEventFeature(clicked, routes);

        expect(event.properties.fromSection?.countryCodeISO2).toBe('FR');
        expect(event.properties.toSection?.countryCodeISO2).toBe('CH');
    });

    test('tells apart two sections of the same country, which a code alone cannot', () => {
        // The route leaves France, then returns to it — the second crossing joins CH to the *later*
        // French section, so resolving by code would hand back the first one.
        const [, secondCrossing] = toDisplayCountryCrossings(routes).features;
        const event = toCountryCrossingEventFeature(secondCrossing as unknown as MapGeoJSONFeature, routes);

        expect(event.properties.toSection?.startPointIndex).toBe(7);
        expect(event.properties.fromSection?.startPointIndex).toBe(4);
    });

    test('leaves the sections out when the route that carried them is no longer shown', () => {
        const emptyRoutes = { type: 'FeatureCollection', features: [] } as unknown as Routes<DisplayRouteProps>;
        const event = toCountryCrossingEventFeature(clicked, emptyRoutes);

        expect(event.properties.fromSection).toBeUndefined();
        expect(event.properties.label).toBe('FR → CH');
    });
});
