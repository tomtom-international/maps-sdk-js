import type { Map as MapLibreMap } from 'maplibre-gl';
import {
    BufferAttribute,
    DoubleSide,
    Group,
    LoaderUtils,
    type Mesh,
    type MeshStandardMaterial,
    REVISION,
    type WebGLRenderer,
} from 'three';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { KTX2Loader } from 'three/examples/jsm/loaders/KTX2Loader.js';
import { toCreasedNormals } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { GRADIENT_ATTRIBUTE } from './FillExtrusionMaterial';
import type { ModelsSourceSpecification } from './types/modelsSpecifications';
import { isMesh } from './utils';

// Edges sharper than 30° keep their own normals (crisp corners); smoother ones share one (no grain).
const CREASE_ANGLE_RADIANS = Math.PI / 6;

// When a new tile lands this far from the scene origin, rebase the origin so relative
// coordinates stay within float32 precision.
const REBASE_DISTANCE_METRES = 100_000;

const DEFAULT_TRANSCODER_PATH = `https://unpkg.com/three@0.${REVISION}.x/examples/jsm/libs/basis/`;

// Private maplibre-gl internals this source needs, reached via an `unknown` cast.
// The transform hangs off the composed `_camera`, not the map itself.
type MapLibreTransformInternals = {
    _camera: { transform: { tileSize: number } };
};

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
    /**
     * EPSG:3857 origin subtracted from all mesh positions: absolute coordinates (~6·10⁶ m) exceed
     * float32 precision (~0.5 m), which makes landmark edges tremble while zooming. `null` until the
     * first tile with meshes loads.
     */
    sceneOrigin: { x: number; y: number } | null = null;
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

        const coveringTileKeys = new Set<string>();
        for (const tile of this.coveringTiles()) {
            coveringTileKeys.add(tile.key);
            this.loadTile(tile);
        }
        this.showCoveringTilesOnly(coveringTileKeys);
    }

    // Renders only the tiles that cover the viewport, so landmarks leave the screen together with
    // the basemap buildings of the same area. Tiles that fall outside stay in memory, ready to
    // render again without a refetch.
    private showCoveringTilesOnly(coveringTileKeys: Set<string>): void {
        for (const tile of this.scene.children) {
            tile.visible = coveringTileKeys.has(tile.userData.key as string);
        }
    }

    // With 3D terrain, a tile on a hill is in view before its sea-level footprint is: MapLibre's own
    // sources pass the terrain so tiles are bounded by their elevation range. The public options type
    // leaves `terrain` out, but `coveringTiles` forwards it, so the options go in as a variable.
    private coveringTiles(): CoveringTile[] {
        const transform = (this.map as unknown as MapLibreTransformInternals)._camera.transform;
        const options = {
            tileSize: transform.tileSize,
            minzoom: this.minzoom,
            maxzoom: this.maxzoom,
            terrain: this.map.terrain,
        };
        return this.map.coveringTiles(options);
    }

    // The source loads a single zoom level, so tiles never overlap; each is fetched once.
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
                this.rebaseToSceneOrigin(scene);
                scene.userData = { isTile: true, key: tile.key };
                this.scene.add(scene);
                this.onTileLoaded?.(scene, tile.key);
            })
            .catch((error: { message?: string }) => {
                console.warn(`Problem with loading ${tile.toString()}: ${error?.message ?? 'unknown'}`);
            });
    }

    // Rewrites the tile's meshes from absolute EPSG:3857 positions to positions relative to
    // `sceneOrigin`, which ModelsLayer.alignCameraToMap folds back in.
    private rebaseToSceneOrigin(tileScene: Group): void {
        const meshes: Mesh[] = [];
        tileScene.traverse((child) => {
            if (isMesh(child)) {
                meshes.push(child);
            }
        });
        if (meshes.length === 0) {
            return;
        }

        const anchor = meshes[0].position;
        const anchorOrigin = { x: Math.round(anchor.x), y: Math.round(anchor.y) };
        if (!this.sceneOrigin) {
            this.sceneOrigin = anchorOrigin;
        } else if (Math.hypot(anchor.x - this.sceneOrigin.x, anchor.y - this.sceneOrigin.y) > REBASE_DISTANCE_METRES) {
            // The viewport moved far from the origin (e.g. a fly-to across cities): move the
            // origin and shift the already-loaded meshes accordingly.
            const deltaX = anchorOrigin.x - this.sceneOrigin.x;
            const deltaY = anchorOrigin.y - this.sceneOrigin.y;
            this.scene.traverse((child) => {
                if (isMesh(child)) {
                    child.position.x -= deltaX;
                    child.position.y -= deltaY;
                }
            });
            this.sceneOrigin = anchorOrigin;
        }
        for (const mesh of meshes) {
            mesh.position.x -= this.sceneOrigin.x;
            mesh.position.y -= this.sceneOrigin.y;
        }
    }

    // Fetch via the global `fetch` (not three.js' XHR) so it rides any installed
    // session wrapper — e.g. the demos-proxy cookie gate — then parse the GLB.
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
        bakeGradientAttribute(child);
    });
};

// Bakes the GRADIENT_ATTRIBUTE term per vertex, with base = 0 and t = z / height.
const bakeGradientAttribute = (mesh: Mesh): void => {
    const geometry = mesh.geometry;
    const positions = geometry.getAttribute('position');
    geometry.computeBoundingBox();
    const height = geometry.boundingBox?.max.z ?? 0;
    const gradientScale = height > 0 ? Math.sqrt(height / 150) / height : 0;
    const gradient = new Float32Array(positions.count);
    for (let index = 0; index < positions.count; index++) {
        gradient[index] = positions.getZ(index) * gradientScale;
    }
    geometry.setAttribute(GRADIENT_ATTRIBUTE, new BufferAttribute(gradient, 1));
};
