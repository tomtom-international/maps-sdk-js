import { Group } from 'three';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ModelsSource } from '../ModelsSource';
import type { ModelsSourceSpecification } from '../types/modelsSpecifications';

const TILE_URL = 'https://proxy.example.com/tile/15/16826/10770.glb';

const makeSource = (overrides: Partial<ModelsSourceSpecification> = {}): ModelsSource =>
    new ModelsSource('landmarks', { type: 'models', tiles: [TILE_URL], ...overrides });

// fetchTile is private; reach it directly so a failure surfaces here rather than only in E2E.
const fetchTile = (source: ModelsSource, url: string): Promise<Group | null> =>
    (source as unknown as { fetchTile(url: string): Promise<Group | null> }).fetchTile(url);

const mockResponse = (init: Partial<Response> & { status: number }): Response =>
    ({ ok: init.status >= 200 && init.status < 300, arrayBuffer: async () => new ArrayBuffer(8), ...init }) as Response;

describe('ModelsSource.fetchTile', () => {
    afterEach(() => {
        vi.restoreAllMocks();
        vi.unstubAllGlobals();
    });

    it('parses the GLB and resolves relative resources against the tile URL', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(mockResponse({ status: 200 })));
        const source = makeSource();
        const scene = new Group();
        const gltfLoader = (source as unknown as { gltfLoader: { parseAsync: (...args: unknown[]) => unknown } })
            .gltfLoader;
        const parseAsync = vi.spyOn(gltfLoader, 'parseAsync').mockResolvedValue({ scene });

        await expect(fetchTile(source, TILE_URL)).resolves.toBe(scene);
        expect(parseAsync).toHaveBeenCalledWith(expect.any(ArrayBuffer), 'https://proxy.example.com/tile/15/16826/');
    });

    it.each([204, 404])('treats %i as an expected empty tile and returns null', async (status) => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(mockResponse({ status })));
        await expect(fetchTile(makeSource(), TILE_URL)).resolves.toBeNull();
    });

    it('throws on an unexpected error status so the caller can log it', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(mockResponse({ status: 401 })));
        await expect(fetchTile(makeSource(), TILE_URL)).rejects.toThrow('401');
    });

    it('sends credentials only when configured for a credentialed proxy', async () => {
        const fetchMock = vi.fn().mockResolvedValue(mockResponse({ status: 204 }));
        vi.stubGlobal('fetch', fetchMock);

        await fetchTile(makeSource({ withCredentials: true }), TILE_URL);
        expect(fetchMock).toHaveBeenLastCalledWith(TILE_URL, { credentials: 'include' });

        await fetchTile(makeSource({ withCredentials: false }), TILE_URL);
        expect(fetchMock).toHaveBeenLastCalledWith(TILE_URL, undefined);
    });
});
