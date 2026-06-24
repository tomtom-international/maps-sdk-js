import type { Routes } from '@tomtom-org/maps-sdk/core';
import { describe, expect, it } from 'vitest';
import { incidentsFromRoutes } from './routeIncidents';

type RouteFeature = Routes['features'][number];
type Sections = RouteFeature['properties']['sections'];
type TrafficSection = NonNullable<Sections['traffic']>[number];
type RoadStretch = NonNullable<Sections['importantRoadStretch']>[number];

// A straight 5-point line: coordinate indices 0..4 map to [0,0]..[4,0].
const LINE: GeoJSON.Position[] = [
    [0, 0],
    [1, 0],
    [2, 0],
    [3, 0],
    [4, 0],
];

const trafficSection = (props: Partial<TrafficSection>): TrafficSection =>
    ({
        id: 't',
        startPointIndex: 1,
        endPointIndex: 3,
        categories: ['jam'],
        magnitudeOfDelay: 'moderate',
        delayInSeconds: 120,
        ...props,
    }) as TrafficSection;

const stretch = (props: Partial<RoadStretch>): RoadStretch =>
    ({ id: 's', index: 0, startPointIndex: 0, endPointIndex: 2, ...props }) as RoadStretch;

const route = (
    index: number,
    traffic: TrafficSection[],
    importantRoadStretch: RoadStretch[] = [],
    coordinates: GeoJSON.Position[] = LINE,
): RouteFeature =>
    ({
        type: 'Feature',
        geometry: { type: 'LineString', coordinates },
        properties: { index, sections: { leg: [], traffic, importantRoadStretch } },
    }) as unknown as RouteFeature;

const routes = (...features: RouteFeature[]): Routes => ({ type: 'FeatureCollection', features }) as unknown as Routes;

describe('incidentsFromRoutes', () => {
    it('maps a traffic section to a TrafficIncident with the area-panel shape', () => {
        const [incident, ...rest] = incidentsFromRoutes([routes(route(0, [trafficSection({})]))]);
        expect(rest).toHaveLength(0);
        expect(incident).toEqual({
            type: 'Feature',
            geometry: {
                type: 'LineString',
                coordinates: [
                    [1, 0],
                    [2, 0],
                    [3, 0],
                ],
            },
            properties: {
                id: 'route-0-traffic-0',
                category: 'jam',
                magnitudeOfDelay: 'moderate',
                delayInSeconds: 120,
                timeValidity: 'present',
                events: [],
            },
        });
    });

    it('attaches road numbers from an overlapping importantRoadStretch', () => {
        const [incident] = incidentsFromRoutes([
            routes(route(0, [trafficSection({})], [stretch({ roadNumbers: ['A10', 'E22'] })])),
        ]);
        expect(incident.properties.roadNumbers).toEqual(['A10', 'E22']);
    });

    it('falls back to the street name when a stretch has no road numbers', () => {
        const [incident] = incidentsFromRoutes([
            routes(route(0, [trafficSection({})], [stretch({ streetName: 'Ringweg-West' })])),
        ]);
        expect(incident.properties.roadNumbers).toEqual(['Ringweg-West']);
    });

    it('ignores stretches whose range does not overlap the incident', () => {
        const [incident] = incidentsFromRoutes([
            routes(
                route(
                    0,
                    [trafficSection({ startPointIndex: 1, endPointIndex: 2 })],
                    [stretch({ startPointIndex: 10, endPointIndex: 12, roadNumbers: ['A10'] })],
                ),
            ),
        ]);
        expect(incident.properties.roadNumbers).toBeUndefined();
    });

    it('uses a Point geometry when the section spans a single coordinate', () => {
        const [incident] = incidentsFromRoutes([
            routes(route(0, [trafficSection({ startPointIndex: 2, endPointIndex: 2 })])),
        ]);
        expect(incident.geometry).toEqual({ type: 'Point', coordinates: [2, 0] });
    });

    it('defaults category to "unknown" and delay to 0 when absent', () => {
        const [incident] = incidentsFromRoutes([
            routes(route(0, [trafficSection({ categories: [], delayInSeconds: undefined })])),
        ]);
        expect(incident.properties.category).toBe('unknown');
        expect(incident.properties.delayInSeconds).toBe(0);
    });

    it('de-duplicates the same incident shared across alternatives', () => {
        // Two alternatives carrying the same incident (same category, road, start point).
        const incidents = incidentsFromRoutes([
            routes(
                route(0, [trafficSection({})], [stretch({ roadNumbers: ['A10'] })]),
                route(1, [trafficSection({})], [stretch({ roadNumbers: ['A10'] })]),
            ),
        ]);
        expect(incidents).toHaveLength(1);
        expect(incidents[0].properties.id).toBe('route-0-traffic-0'); // first one wins
    });

    it('keeps distinct incidents and combines across route collections', () => {
        const incidents = incidentsFromRoutes([
            routes(route(0, [trafficSection({ categories: ['jam'] })], [stretch({ roadNumbers: ['A10'] })])),
            routes(route(0, [trafficSection({ categories: ['road-closed'] })], [stretch({ roadNumbers: ['N201'] })])),
        ]);
        expect(incidents).toHaveLength(2);
        expect(incidents.map((i) => i.properties.category)).toEqual(['jam', 'road-closed']);
    });

    it('returns nothing when a route has no traffic sections', () => {
        expect(incidentsFromRoutes([routes(route(0, []))])).toEqual([]);
    });

    it('returns nothing for an empty collection list', () => {
        expect(incidentsFromRoutes([])).toEqual([]);
    });
});
