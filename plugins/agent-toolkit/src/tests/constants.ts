import type {
    CommonPlaceProps,
    Place,
    PolygonFeature,
    RevGeoAddressProps,
    Route,
    RouteProps,
} from '@tomtom-org/maps-sdk/core';
import { TomTomMap } from '@tomtom-org/maps-sdk/map';
import type { GeocodingProps } from '@tomtom-org/maps-sdk/services';
import type { Polygon } from 'geojson';
import { vi } from 'vitest';
import { BYODState, CustomGeometriesState, PlacesState, RangeState, RoutingState } from '../state';
import type { ToolState } from '../types';

/** Minimal valid Place — id/geometry/type/address are the fields tools actually read. */
export const makeMockPlace = (overrides: Partial<Place> = {}): Place => {
    return {
        type: 'Feature',
        id: 'mock-place',
        geometry: { type: 'Point', coordinates: [0, 0] },
        properties: { type: 'Geography', address: { freeformAddress: 'Mock Place' } },
        ...overrides,
    };
};

// geocodeOne/geocode return Place<GeocodingProps> — CommonPlaceProps plus two fields
// (type narrowed to exclude 'POI', and a required matchConfidence) that searchOne/search
// don't require, so the geocode-path mocks layer those on top of the shared makeMockPlace.
export const makeGeocodingPlace = (overrides: Partial<Place<GeocodingProps>> = {}): Place<GeocodingProps> =>
    ({
        ...makeMockPlace(),
        ...overrides,
        properties: {
            type: 'Geography',
            address: { freeformAddress: 'London, UK' },
            matchConfidence: { score: 1 },
            ...overrides.properties,
        },
    }) as Place<GeocodingProps>;

// reverseGeocode returns Place<RevGeoAddressProps> — CommonPlaceProps plus the required
// originalPosition (the query coordinates), so the revgeo-path mocks layer that on top of
// the shared makeMockPlace.
export const makeRevGeoPlace = (overrides: Partial<Place<RevGeoAddressProps>> = {}): Place<RevGeoAddressProps> => ({
    ...makeMockPlace(),
    ...overrides,
    properties: {
        type: 'Geography',
        address: { freeformAddress: 'London, UK' },
        originalPosition: [0, 0],
        ...overrides.properties,
    },
});

/** Minimal valid Route feature — `properties` is cast since RouteProps' summary/sections are
 * never read by the code paths these mocks exercise (e.g. searchByDetour only reads geometry). */
export const makeMockRoute = (overrides: Partial<Route> = {}): Route => {
    return {
        type: 'Feature',
        id: 'mock-route',
        geometry: {
            type: 'LineString',
            coordinates: [
                [0, 0],
                [1, 1],
            ],
        },
        properties: {} as RouteProps,
        bbox: [0, 0, 1, 1],
        ...overrides,
    };
};

/** A calculated-route FeatureCollection (`Routes`) with a full `summary` + `sections.leg` —
 * unlike makeMockRoute (properties: {}), the routing-edit tools run summarizeRoutes/makeRoutesLabel
 * over the calculateRoute result, which read summary.travelTimeInSeconds/lengthInMeters and
 * sections.leg, so those fields must be present. */
export const makeMockCalculatedRoutes = (
    overrides: Partial<Route> = {},
): { type: 'FeatureCollection'; features: Route[] } => {
    const departureTime = new Date('2024-01-01T00:00:00Z');
    const arrivalTime = new Date('2024-01-01T00:10:00Z');
    const summary = { lengthInMeters: 1000, travelTimeInSeconds: 600, departureTime, arrivalTime };
    return {
        type: 'FeatureCollection',
        features: [
            {
                type: 'Feature',
                id: 'route-0',
                geometry: {
                    type: 'LineString',
                    coordinates: [
                        [0, 0],
                        [1, 1],
                    ],
                },
                bbox: [0, 0, 1, 1],
                properties: {
                    index: 0,
                    summary,
                    sections: { leg: [{ summary }] },
                } as unknown as RouteProps,
                ...overrides,
            },
        ],
    };
};

/** A fresh RangeState with one entry (a single-polygon reachable range) already added —
 * getRangePolygons reads the polygon back off state.ranges.entries, so a `within` + `range`
 * test needs a real entry, not a hand-inserted one. Returns the RangeState (to pass into
 * makeMockState) and the rangeId (to pass as `where.range`). */
export const makeMockRanges = async (polygon: Polygon): Promise<{ ranges: RangeState; rangeId: string }> => {
    const ranges = new RangeState({} as TomTomMap);
    const rangeId = await ranges.addEntry({
        label: 'range',
        data: [
            {
                origin: { position: [4.9, 52.4] },
                budgets: [],
                polygon: {
                    type: 'FeatureCollection',
                    features: [{ type: 'Feature', geometry: polygon, properties: {}, bbox: [0, 0, 1, 1] }],
                },
            },
        ],
    });
    return { ranges, rangeId };
};

/** A fresh PlacesState with one entry (makeMockPlace) already added — returns the state
 * (to pass into makeMockState) and the placeId (to pass as `placeIdOrEntryId`). */
export const makeMockPlaces = async (): Promise<{ places: PlacesState; placeId: string }> => {
    const places = new PlacesState({} as TomTomMap);
    const placeId = await places.addPlaceResult(makeMockPlace(), 'seed place');
    return { places, placeId };
};

/** A fresh RoutingState with one planning waypoint slot filled — no calculated route entry,
 * since setWaypointAt only populates planningSlots, not entries. */
export const makeMockRouting = (): { routing: RoutingState } => {
    const routing = new RoutingState({} as TomTomMap);
    routing.setWaypointAt(0, [4.9, 52.4]);
    return { routing };
};

/** A fresh CustomGeometriesState with one polygon entry already added — returns the state
 * and the geometryId. */
export const makeMockCustomGeometries = async (
    polygon: Polygon,
): Promise<{ customGeometries: CustomGeometriesState; geometryId: string }> => {
    const customGeometries = new CustomGeometriesState({} as TomTomMap);
    const geometryId = await customGeometries.addEntry(
        [{ type: 'Feature', id: 'g0', geometry: polygon, properties: {} } as PolygonFeature<CommonPlaceProps>],
        { sourceIds: [] },
        'seed geometry',
    );
    return { customGeometries, geometryId };
};

/** A fresh BYODState with one (empty) FeatureCollection entry already added — returns the
 * state and the byodId. */
export const makeMockByod = async (): Promise<{ byod: BYODState; byodId: string }> => {
    const byod = new BYODState({} as TomTomMap);
    const byodId = await byod.addEntry({ type: 'FeatureCollection', features: [] }, 'seed byod');
    return { byod, byodId };
};

const createDefaultMock = (): ToolState =>
    ({
        places: {
            entries: [],
            shownEntryIds: new Set<string>(),
            entryMode: 'multiple',
            latestPlace: undefined,
            events: { emit: vi.fn(), on: vi.fn(), off: vi.fn() },
            addPlaceResult: vi.fn(),
        },

        mapPOIs: {
            poisModule: undefined,
            events: { emit: vi.fn(), on: vi.fn(), off: vi.fn() },
        },

        routing: {
            entries: [],
            shownEntryIds: new Set<string>(),
            entryMode: 'multiple',
            params: {},
            currentWaypoints: undefined,
            planningSlots: [],
            currentEntryModule: undefined,
            events: { emit: vi.fn(), on: vi.fn(), off: vi.fn() },
            setWaypointAt: vi.fn(),
        },

        baseMap: {
            ttMap: {
                setStyle: vi.fn(),
                // `fitBounds` is a real vi.fn() (not `{}`) so callers can assert on it directly —
                // e.g. `expect(state.baseMap.mapLibreMap.fitBounds).toHaveBeenCalledWith(...)` —
                // without an `as any` cast to add the method first.
                mapLibreMap: { fitBounds: vi.fn() },
            },
            get mapLibreMap() {
                return (this as any).ttMap.mapLibreMap;
            },
            events: {},
        },

        trafficTiles: {
            trafficFlowModule: undefined,
            trafficIncidentsModule: undefined,
            events: {},
        },

        trafficAreaAnalytics: {
            entries: [],
            shownEntryIds: new Set<string>(),
            events: {},
        },

        trafficIncidents: {
            entries: [],
            shownEntryIds: new Set<string>(),
            events: {},
        },

        ranges: {
            entries: [],
            shownEntryIds: new Set<string>(),
            entryMode: 'multiple',
            events: {},
        },

        customGeometries: {
            entries: [],
            shownEntryIds: new Set<string>(),
            events: {},
        },

        byod: {
            entries: [],
            shownEntryIds: new Set<string>(),
            events: {},
        },
        codeExecution: undefined,
        engine: {},
        analyses: {
            events: {},
        },

        trackers: {
            trackers: [],
            log: vi.fn().mockReturnValue([]),
            reset: vi.fn(),
            events: { emit: vi.fn(), on: vi.fn(), off: vi.fn() },
        },
    }) as unknown as ToolState;

export const makeMockState = (overrides: Partial<ToolState> = {}): ToolState => {
    const base = createDefaultMock();
    return { ...base, ...overrides };
};
