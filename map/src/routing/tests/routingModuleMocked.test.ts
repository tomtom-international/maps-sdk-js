import type { Map } from 'maplibre-gl';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { CombinedEvents, mapStyleLayerIDs, UserEvents } from '../../shared';
import type { TomTomMap } from '../../TomTomMap';
import { routeDeselectedOutline } from '../layers/routeMainLineLayers';
import { RoutingModule } from '../RoutingModule';

// NOTE: these tests are heavily mocked and are mostly used to keep coverage numbers high.
// For real testing of such modules, refer to map-integration-tests.
// Any forced coverage from tests here must be truly covered in map integration tests.
describe('Routing module tests', () => {
    let tomtomMapMock: TomTomMap;

    beforeEach(() => {
        // getSource returns a fresh stub for any requested id — works for both the per-source
        // lookups during init and the universal lookups during the restore path.
        tomtomMapMock = {
            mapLibreMap: {
                getSource: vi.fn().mockImplementation((id: string) => ({ id, setData: vi.fn() })),
                getLayer: vi.fn().mockReturnValue({}),
                addLayer: vi.fn(),
                removeLayer: vi.fn(),
                // Read and written when the module settles which icons a section's signs give way
                // to; the stacking itself is asserted in the integration tests.
                getStyle: vi.fn().mockReturnValue({ layers: [] }),
                moveLayer: vi.fn(),
                hasImage: vi.fn().mockReturnValue(false),
                addImage: vi.fn(),
                loadImage: vi.fn().mockResolvedValue(vi.fn()),
                setLayoutProperty: vi.fn(),
                setFilter: vi.fn(),
                setPaintProperty: vi.fn(),
            } as unknown as Map,
            _eventsProxy: {
                add: vi.fn(),
                ensureAdded: vi.fn(),
                updateIfRegistered: vi.fn(),
            },
            addStyleChangeHandler: vi.fn(),
            once: vi.fn().mockReturnValue(Promise.resolve()),
            mapReady: vi.fn().mockReturnValue(true),
        } as unknown as TomTomMap;
    });

    test('Basic flows', async () => {
        const routing = await RoutingModule.create(tomtomMapMock);
        routing.showRoutes({ type: 'FeatureCollection', features: [] });
        routing.selectRoute(0);
        routing.clearRoutes();
        routing.showWaypoints([]);
        routing.showWaypoints({ type: 'FeatureCollection', features: [] });
        routing.clearWaypoints();
        expect(routing.getLayerToRenderLinesUnder()).toEqual(mapStyleLayerIDs.lowestLabel);
        routing.applyConfig({
            layers: {
                mainLines: {
                    additional: {
                        'a-different-id': {
                            ...routeDeselectedOutline(),
                            beforeID: mapStyleLayerIDs.lowestLabel,
                        },
                    },
                },
            },
        });

        // A named scope is user events over one part of the route: `on` / `off` / `where`, and no
        // lifecycle half — a scope narrows neither the module's config nor its `show`. See LSI-159.
        for (const scope of [
            routing.events.mainLines,
            routing.events.waypoints,
            routing.events.chargingStops,
            routing.events.summaryBubbles,
            routing.events.incidents,
            routing.events.vehicleRestricted,
            routing.events.ferries,
            routing.events.tollRoads,
            routing.events.tunnels,
            routing.events.instructionLines,
        ]) {
            expect(scope).toBeInstanceOf(UserEvents);
            expect(typeof scope.where).toBe('function');
            expect(scope).not.toBeInstanceOf(CombinedEvents);
        }

        // Module-wide user and lifecycle events live on `events` itself.
        expect(typeof routing.events.on).toBe('function');
        expect(typeof routing.events.where).toBe('function');
        // `instructionArrows` is a decoration along the instruction lines, not a scope of its own.
        expect(routing.events).not.toHaveProperty('instructionArrows');
    });

    test('the toll overlay draws the tollRoad sections, not the toll ones', async () => {
        // `tollRoad` is the type that covers every charged stretch — per-use tolls, vignette-only
        // motorways and urban charge zones — where `toll` covers only the per-use ones. A route
        // carrying both must render the wider set.
        const routing = await RoutingModule.create(tomtomMapMock);
        await routing.showRoutes({
            type: 'FeatureCollection',
            features: [
                {
                    type: 'Feature',
                    geometry: {
                        type: 'LineString',
                        coordinates: [
                            [0, 0],
                            [1, 1],
                            [2, 2],
                            [3, 3],
                        ],
                    },
                    properties: {
                        summary: {
                            lengthInMeters: 1000,
                            travelTimeInSeconds: 100,
                            trafficDelayInSeconds: 0,
                            trafficLengthInMeters: 0,
                        },
                        sections: {
                            leg: [],
                            toll: [{ id: 'toll-1', startPointIndex: 2, endPointIndex: 3 }],
                            tollRoad: [{ id: 'tollRoad-1', startPointIndex: 0, endPointIndex: 3 }],
                        },
                    },
                } as never,
            ],
        });

        const shown = routing.getShown().tollRoads;
        expect(shown?.features).toHaveLength(1);
        expect(shown?.features[0].properties.id).toBe('tollRoad-1');
    });

    test('restoreDataAndConfigImpl keeps source and layer IDs stable across a style change', async () => {
        const routing = await RoutingModule.create(tomtomMapMock);
        const before = structuredClone(routing.sourceAndLayerIDs);

        (routing as unknown as { restoreDataAndConfigImpl(): void }).restoreDataAndConfigImpl();

        expect(routing.sourceAndLayerIDs).toEqual(before);
    });
});
