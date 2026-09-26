import { BoxGeometry, DoubleSide, Group, Mesh, MeshStandardMaterial } from 'three';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { GRADIENT_ATTRIBUTE } from '../FillExtrusionMaterial';
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

describe('ModelsSource.rebaseToSceneOrigin', () => {
    const rebaseToSceneOrigin = (source: ModelsSource, tileScene: Group): void =>
        (source as unknown as { rebaseToSceneOrigin(tileScene: Group): void }).rebaseToSceneOrigin(tileScene);

    const makeTileScene = (positions: [number, number][]): Group => {
        const tileScene = new Group();
        for (const [x, y] of positions) {
            const mesh = new Mesh();
            mesh.position.set(x, y, 0);
            tileScene.add(mesh);
        }
        return tileScene;
    };

    const meshPositions = (group: Group): [number, number][] => {
        const positions: [number, number][] = [];
        group.traverse((child) => {
            if ((child as Mesh).isMesh) positions.push([child.position.x, child.position.y]);
        });
        return positions;
    };

    it('rebases mesh positions relative to the first tile and exposes the origin', () => {
        const source = makeSource();
        const tileScene = makeTileScene([
            [1268240.4, 5985995.9],
            [1268300.4, 5986095.9],
        ]);
        rebaseToSceneOrigin(source, tileScene);

        expect(source.sceneOrigin).toEqual({ x: 1268240, y: 5985996 });
        const [first, second] = meshPositions(tileScene);
        expect(first[0]).toBeCloseTo(0.4, 6);
        expect(first[1]).toBeCloseTo(-0.1, 6);
        expect(second[0]).toBeCloseTo(60.4, 6);
        expect(second[1]).toBeCloseTo(99.9, 6);
    });

    it('keeps the origin for nearby tiles and rebases for far ones, shifting loaded meshes', () => {
        const source = makeSource();
        const firstTile = makeTileScene([[1000000, 5000000]]);
        rebaseToSceneOrigin(source, firstTile);
        source.scene.add(firstTile);
        const firstOrigin = source.sceneOrigin;

        const nearbyTile = makeTileScene([[1000500, 5000500]]);
        rebaseToSceneOrigin(source, nearbyTile);
        expect(source.sceneOrigin).toEqual(firstOrigin);

        const farTile = makeTileScene([[2000000, 6000000]]);
        rebaseToSceneOrigin(source, farTile);
        expect(source.sceneOrigin).toEqual({ x: 2000000, y: 6000000 });
        // The previously loaded mesh keeps its absolute position: relative + new origin.
        const [previousMesh] = meshPositions(firstTile);
        expect(previousMesh[0] + 2000000).toBeCloseTo(1000000, 5);
        expect(previousMesh[1] + 6000000).toBeCloseTo(5000000, 5);
        const [farMesh] = meshPositions(farTile);
        expect(farMesh[0]).toBeCloseTo(0, 6);
        expect(farMesh[1]).toBeCloseTo(0, 6);
    });
});

describe('ModelsSource tile loading', () => {
    type CoveringTile = { key: string; canonical: { url: () => string }; toString: () => string };
    type ModelsSourceInternals = {
        fetchTile(url: string): Promise<Group | null>;
        coveringTiles(): CoveringTile[];
    };

    const coveringTile = (key: string): CoveringTile => ({
        key,
        canonical: { url: () => TILE_URL },
        toString: () => key,
    });

    const makeLoadingSource = (tileScenes: (Group | null)[]) => {
        const source = makeSource();
        source.map = { getPixelRatio: () => 1 } as unknown as ModelsSource['map'];
        const internals = source as unknown as ModelsSourceInternals;
        const fetchTile = vi.spyOn(internals, 'fetchTile').mockImplementation(async () => tileScenes.shift() ?? null);
        const coveringTiles = vi.spyOn(internals, 'coveringTiles');
        return { source, fetchTile, coveringTiles };
    };

    // A 30 m tall landmark standing on its base, in absolute EPSG:3857 metres like a real tile.
    const landmarkTile = () => {
        const mesh = new Mesh(new BoxGeometry(10, 10, 30).translate(0, 0, 15), new MeshStandardMaterial());
        mesh.position.set(1268240, 5985996, 0);
        const tileScene = new Group();
        tileScene.add(mesh);
        return tileScene;
    };

    const loadedMeshes = (source: ModelsSource): Mesh[] => {
        const meshes: Mesh[] = [];
        source.scene.traverse((child) => {
            if ((child as Mesh).isMesh) meshes.push(child as Mesh);
        });
        return meshes;
    };

    it('fetches each covering tile once and bakes the vertical gradient into its meshes', async () => {
        const { source, fetchTile, coveringTiles } = makeLoadingSource([landmarkTile()]);
        const onTileLoaded = vi.fn();
        source.onTileLoaded = onTileLoaded;
        coveringTiles.mockReturnValue([coveringTile('15/1/2')]);

        source.updateTiles();
        source.updateTiles();
        await vi.waitFor(() => expect(onTileLoaded).toHaveBeenCalledTimes(1));

        expect(fetchTile).toHaveBeenCalledTimes(1);
        const [mesh] = loadedMeshes(source);
        expect(mesh.userData.originalMaterial).toBeInstanceOf(MeshStandardMaterial);
        expect((mesh.material as MeshStandardMaterial).side).toBe(DoubleSide);
        // maplibre's `pow(height / 150, 0.5)` at the top of a 30 m wall, nothing at its foot.
        const gradient = Array.from(mesh.geometry.getAttribute(GRADIENT_ATTRIBUTE).array);
        expect(Math.max(...gradient)).toBeCloseTo(Math.sqrt(30 / 150), 6);
        expect(Math.min(...gradient)).toBeCloseTo(0, 6);
        expect(source.scene.children[0].userData.key).toBe('15/1/2');
    });

    it('shows only the tiles covering the viewport, keeping the others loaded', async () => {
        const { source, coveringTiles } = makeLoadingSource([landmarkTile(), landmarkTile()]);
        coveringTiles.mockReturnValue([coveringTile('15/1/2'), coveringTile('15/1/3')]);
        source.updateTiles();
        await vi.waitFor(() => expect(source.scene.children).toHaveLength(2));

        coveringTiles.mockReturnValue([coveringTile('15/1/3')]);
        source.updateTiles();

        const visibility = Object.fromEntries(source.scene.children.map((tile) => [tile.userData.key, tile.visible]));
        expect(visibility).toEqual({ '15/1/2': false, '15/1/3': true });
    });

    it('bounds the covering tiles by the terrain, so a landmark raised into view counts as covering', () => {
        const source = makeSource();
        const terrain = { getMinMaxElevation: vi.fn() };
        const coveringTiles = vi.fn().mockReturnValue([]);
        source.map = {
            _camera: { transform: { tileSize: 512 } },
            terrain,
            coveringTiles,
        } as unknown as ModelsSource['map'];

        source.updateTiles();

        expect(coveringTiles).toHaveBeenCalledWith(expect.objectContaining({ terrain }));
    });

    it('adds nothing for an empty tile', async () => {
        const { source, fetchTile, coveringTiles } = makeLoadingSource([null]);
        coveringTiles.mockReturnValue([coveringTile('15/1/2')]);

        source.updateTiles();
        await vi.waitFor(() => expect(fetchTile).toHaveBeenCalledTimes(1));

        expect(source.scene.children).toHaveLength(0);
    });
});
