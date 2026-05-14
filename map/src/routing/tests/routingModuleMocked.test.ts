import type { Map } from 'maplibre-gl';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { mapStyleLayerIDs, UserEvents } from '../../shared';
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
        const routing = await RoutingModule.get(tomtomMapMock);
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

        expect(routing.events.user.mainLines).toBeInstanceOf(UserEvents);
        expect(routing.events.user.waypoints).toBeInstanceOf(UserEvents);
        expect(routing.events.user.vehicleRestricted).toBeInstanceOf(UserEvents);
        expect(routing.events.user.incidents).toBeInstanceOf(UserEvents);
        expect(routing.events.user.ferries).toBeInstanceOf(UserEvents);
        expect(routing.events.user.tollRoads).toBeInstanceOf(UserEvents);
        expect(routing.events.user.tunnels).toBeInstanceOf(UserEvents);
        expect(routing.events.user.instructionLines).toBeInstanceOf(UserEvents);
        expect(routing.events.user.summaryBubbles).toBeInstanceOf(UserEvents);
    });

    test('restoreDataAndConfigImpl keeps source and layer IDs stable across a style change', async () => {
        const routing = await RoutingModule.get(tomtomMapMock);
        const before = structuredClone(routing.sourceAndLayerIDs);

        (routing as unknown as { restoreDataAndConfigImpl(): void }).restoreDataAndConfigImpl();

        expect(routing.sourceAndLayerIDs).toEqual(before);
    });
});
