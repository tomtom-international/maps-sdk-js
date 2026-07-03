import type { Map as MapLibreMap } from 'maplibre-gl';
import { DoubleSide, Group, LoaderUtils, type MeshStandardMaterial, REVISION, type WebGLRenderer } from 'three';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { KTX2Loader } from 'three/examples/jsm/loaders/KTX2Loader.js';
import { toCreasedNormals } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import type { ModelsSourceSpecification } from './types/modelsSpecifications';
import { isMesh } from './utils';

// Edges sharper than 30° keep their own normals (crisp corners); smoother ones share one (no grain).
const CREASE_ANGLE_RADIANS = Math.PI / 6;

const DEFAULT_TRANSCODER_PATH = `https://unpkg.com/three@0.${REVISION}.x/examples/jsm/libs/basis/`;

// Private maplibre-gl internals this source needs, reached via an `unknown` cast.
interface MapLibreTransformInternals {
    transform: { tileSize: number };
}

// Element of maplibre's coveringTiles() result; exposes `.key`, `.canonical.{z,url}` and `.toString()`.
type CoveringTile = ReturnType<MapLibreMap['coveringTiles']>[number];

/**
 * Source of tiled glTF/GLB models for a {@link ModelsLayer}.
 *
 * Tracks the tiles covering the current viewport, fetches each tile's models once
 * and keeps them in a Three.js {@link Group} that the owning layer renders.
 *
 * @group Landmarks 3D
 */
export class ModelsSource {
    type = 'models' as const;
    id: string;
    minzoom: number;
    maxzoom: number;
    map!: MapLibreMap;
    tiles: Array<string>;
    scene: Group;
    loadedTiles = new Set<string>();
    /** Optional consumer callback fired once per successful tile load. */
    onTileLoaded?: (scene: Group, key: string) => void;

    private readonly ktx2Loader: KTX2Loader;
    private readonly gltfLoader: GLTFLoader;
    private readonly specification: ModelsSourceSpecification;
    private readonly withCredentials: boolean;

    constructor(id: string, options: ModelsSourceSpecification) {
        this.id = id;
        this.minzoom = options.minzoom ?? 0;
        this.maxzoom = options.maxzoom ?? 22;
        this.tiles = options.tiles;
        this.specification = options;
        this.withCredentials = options.withCredentials ?? false;
        this.scene = new Group();
        this.ktx2Loader = new KTX2Loader()
            .setCrossOrigin('anonymous')
            .setTranscoderPath(options.transcoderPath ?? DEFAULT_TRANSCODER_PATH);
        this.gltfLoader = new GLTFLoader().setKTX2Loader(this.ktx2Loader).setMeshoptDecoder(MeshoptDecoder);
    }

    onAdd(map: MapLibreMap, renderer: WebGLRenderer) {
        this.map = map;
        this.ktx2Loader.detectSupport(renderer);
    }

    updateTiles() {
        if (this.tiles.length === 0) {
            return;
        }

        for (const tile of this.coveringTiles()) {
            this.loadTile(tile);
        }
    }

    private coveringTiles(): CoveringTile[] {
        const transform = (this.map as unknown as MapLibreTransformInternals).transform;
        return this.map.coveringTiles({
            tileSize: transform.tileSize,
            minzoom: this.minzoom,
            maxzoom: this.maxzoom,
        });
    }

    // The source loads a single zoom level, so tiles never overlap; each is kept on screen once loaded.
    private loadTile(tile: CoveringTile): void {
        if (this.loadedTiles.has(tile.key)) {
            return;
        }
        this.loadedTiles.add(tile.key);

        const url = tile.canonical.url(this.tiles, this.map.getPixelRatio(), this.specification.scheme);
        this.fetchTile(url)
            .then((scene) => {
                if (!scene) {
                    return; // expected empty tile (no landmark / not produced)
                }
                prepareTileMeshes(scene);
                scene.userData = { isTile: true, key: tile.key };
                this.scene.add(scene);
                this.onTileLoaded?.(scene, tile.key);
            })
            .catch((error: { message?: string }) => {
                console.warn(`Problem with loading ${tile.toString()}: ${error?.message ?? 'unknown'}`);
            });
    }

    // Fetch via the global `fetch` (not three.js' XHR) so it rides any installed
    // session wrapper — e.g. the demo-BFF cookie gate — then parse the GLB.
    private async fetchTile(url: string): Promise<Group | null> {
        const response = await fetch(url, this.withCredentials ? { credentials: 'include' } : undefined);
        // 204 = no landmark in this tile, 404 = tile not produced — both expected.
        if (response.status === 204 || response.status === 404) {
            return null;
        }
        if (!response.ok) {
            throw new Error(`tile request failed with ${response.status}`);
        }
        const buffer = await response.arrayBuffer();
        // Resolve relative resources against the tile URL, as GLTFLoader.load would.
        const { scene } = await this.gltfLoader.parseAsync(buffer, LoaderUtils.extractUrlBase(url));
        return scene;
    }
}

// Stores each mesh's authored material and re-creases its normals so untextured shading keeps crisp edges.
const prepareTileMeshes = (scene: Group): void => {
    scene.traverse((child) => {
        if (!isMesh(child)) {
            return;
        }

        const material = child.material as MeshStandardMaterial;
        material.alphaTest = 0.1;
        material.side = DoubleSide;
        child.userData.originalMaterial = material;
        child.geometry = toCreasedNormals(child.geometry, CREASE_ANGLE_RADIANS);
    });
};
