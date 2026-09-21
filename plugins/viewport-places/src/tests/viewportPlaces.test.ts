import type { TomTomMap } from '@tomtom-org/maps-sdk/map';
import { SDKAbortError } from '@tomtom-org/maps-sdk/services';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ViewportPlaces } from '../viewportPlaces';

const { search, createPlacesModule } = vi.hoisted(() => ({
    search: vi.fn(),
    createPlacesModule: vi.fn(),
}));

vi.mock('@tomtom-org/maps-sdk/services', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@tomtom-org/maps-sdk/services')>();
    return { ...actual, search };
});

vi.mock('@tomtom-org/maps-sdk/map', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@tomtom-org/maps-sdk/map')>();
    return { ...actual, PlacesModule: { create: createPlacesModule } };
});

type PlacesModuleMock = {
    show: ReturnType<typeof vi.fn>;
    clear: ReturnType<typeof vi.fn>;
    applyConfig: ReturnType<typeof vi.fn>;
};

const placesResult = { type: 'FeatureCollection' as const, features: [{ id: 'place-1' }] };

const hangUntilAborted = ({ signal }: { signal?: AbortSignal }) =>
    new Promise((_, reject) => {
        const onAbort = () => reject(new SDKAbortError('Search', signal?.reason));
        if (signal?.aborted) {
            onAbort();
            return;
        }

        signal?.addEventListener('abort', onAbort, { once: true });
    });

describe('ViewportPlaces cancellation', () => {
    let zoom = 12;
    let onMoveEnd: (() => void) | undefined;
    let placesModule: PlacesModuleMock;
    let viewportPlaces: ViewportPlaces;

    beforeEach(() => {
        zoom = 12;
        onMoveEnd = undefined;
        placesModule = {
            show: vi.fn().mockResolvedValue(undefined),
            clear: vi.fn().mockResolvedValue(undefined),
            applyConfig: vi.fn(),
        };
        createPlacesModule.mockReset().mockResolvedValue(placesModule);
        search.mockReset().mockImplementation(hangUntilAborted);

        const map = {
            getBBox: vi.fn(() => [4.8, 52.3, 4.95, 52.4]),
            mapLibreMap: {
                getZoom: () => zoom,
                on: vi.fn((_event: string, handler: () => void) => {
                    onMoveEnd = handler;
                    return { unsubscribe: vi.fn() };
                }),
            },
        } as unknown as TomTomMap;

        viewportPlaces = new ViewportPlaces(map);
    });

    it('aborts the in-flight search when a later moveend supersedes it', async () => {
        const addPromise = viewportPlaces.add({ id: 'cafes', searchOptions: { query: 'cafe' } });
        await vi.waitFor(() => expect(search).toHaveBeenCalledTimes(1));

        const firstSignal = search.mock.calls[0][0].signal as AbortSignal;
        expect(firstSignal.aborted).toBe(false);

        onMoveEnd?.();
        await vi.waitFor(() => expect(search).toHaveBeenCalledTimes(2));

        expect(firstSignal.aborted).toBe(true);
        await addPromise;
        expect(placesModule.show).not.toHaveBeenCalled();

        viewportPlaces.remove('cafes');
    });

    it('aborts an in-flight search when the module is removed', async () => {
        const addPromise = viewportPlaces.add({ id: 'cafes', searchOptions: { query: 'cafe' } });
        await vi.waitFor(() => expect(search).toHaveBeenCalledTimes(1));

        const signal = search.mock.calls[0][0].signal as AbortSignal;
        viewportPlaces.remove('cafes');

        expect(signal.aborted).toBe(true);
        await addPromise;
        expect(placesModule.show).not.toHaveBeenCalled();
        expect(placesModule.clear).toHaveBeenCalled();
    });

    it('does not show a response that arrives after the search was aborted', async () => {
        search.mockImplementation(async () => {
            viewportPlaces.remove('cafes');
            return placesResult;
        });

        await viewportPlaces.add({ id: 'cafes', searchOptions: { query: 'cafe' } });

        expect(placesModule.show).not.toHaveBeenCalled();
    });

    it('aborts the previous search before the zoom guard clears the module', async () => {
        const addPromise = viewportPlaces.add({
            id: 'cafes',
            maxZoom: 14,
            searchOptions: { query: 'cafe' },
        });
        await vi.waitFor(() => expect(search).toHaveBeenCalledTimes(1));

        const firstSignal = search.mock.calls[0][0].signal as AbortSignal;
        zoom = 16;
        onMoveEnd?.();
        await addPromise;

        expect(firstSignal.aborted).toBe(true);
        expect(placesModule.clear).toHaveBeenCalled();
        expect(placesModule.show).not.toHaveBeenCalled();
        expect(search).toHaveBeenCalledTimes(1);
    });
});
