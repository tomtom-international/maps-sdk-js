import type { CustomLayerInterface, CustomRenderMethodInput, Map as MapLibreMap } from 'maplibre-gl';
import {
    AmbientLight,
    Camera,
    DirectionalLight,
    Group,
    Matrix4,
    type Mesh,
    type MeshStandardMaterial,
    Scene,
    type Texture,
    WebGLRenderer,
} from 'three';
import { FillExtrusionDepthMaterial, FillExtrusionMaterial } from './FillExtrusionMaterial';
import { ModelsSource } from './ModelsSource';
import type { ModelsLayerSpecification, ModelsSourceSpecification } from './types/modelsSpecifications';
import { isMesh, MERCATOR_UNITS_PER_METRE, mercatorMetresToLngLat } from './utils';

const TRANSLATE_X = 0.5;
const TRANSLATE_Y = 0.5;

const toRadians = (degrees: number): number => (degrees * Math.PI) / 180;

// Extra sinking below the sampled terrain: keeps walls grounded across unsampled dips and
// the flat bottom cap below the surface, where it cannot z-fight with the ground.
const TERRAIN_BURIAL_MARGIN_METRES = 0.5;

// Subset of the private maplibre-gl internals this layer needs, reached via an `unknown` cast.
// The transform hangs off the composed `_camera`, not the map itself.
type MapLibreRenderInternals = {
    _camera: { transform: { tileZoom: number; bearingInRadians?: number } };
    style: {
        light?: {
            // The evaluated 'position' property is the raw spherical [radial, azimuthal, polar]
            // array; this getter converts it to cartesian [x, y, z].
            getCartesianPosition?(): [number, number, number];
            properties?: {
                get(key: 'intensity'): number;
                get(key: 'anchor'): 'map' | 'viewport';
                get(key: 'color'): { r: number; g: number; b: number };
            };
        };
    };
};

/**
 * MapLibre custom layer that renders tiled glTF/GLB models with Three.js.
 *
 * The layer owns a {@link ModelsSource} that streams model tiles for the current
 * viewport, renders them as maplibre-style fill-extrusion buildings, and keeps its
 * lighting in sync with the map style light.
 *
 * @group Landmarks 3D
 */
export class ModelsLayer implements CustomLayerInterface {
    id: string;
    type = 'custom' as const;
    renderingMode = '3d' as const;

    renderer!: WebGLRenderer;
    scene!: Scene;
    camera!: Camera;
    tiles: Group;
    directionalLight!: DirectionalLight;
    ambientLight!: AmbientLight;
    map!: MapLibreMap;
    source: ModelsSource;
    minzoom = 0;
    maxzoom = 22;
    visible = true;

    diffuseColor = '#ffffff';

    private readonly fillExtrusionMaterial = new FillExtrusionMaterial();
    private readonly depthPrepassMaterial = new FillExtrusionDepthMaterial();
    // Per-texture alpha-masked variants so untextured shading keeps each mesh's carved silhouette.
    private readonly maskedFillExtrusionMaterials = new Map<
        Texture,
        { color: FillExtrusionMaterial; depth: FillExtrusionDepthMaterial }
    >();

    constructor(options: ModelsLayerSpecification, source: ModelsSourceSpecification) {
        this.id = options.id;
        this.source = new ModelsSource(this.id, source);
        this.tiles = this.source.scene;
        this.updateProperties(options);
    }

    updateProperties(options: ModelsLayerSpecification) {
        this.visible = options.layout?.visibility !== 'none';
        this.diffuseColor = options.paint?.['models-base-color'] ?? '#ffffff';
        this.minzoom = options.minzoom ?? 0;
        this.maxzoom = options.maxzoom ?? 22;
    }

    setDirectionalLight(radius: number, phi: number, theta: number) {
        this.directionalLight.position.setFromSphericalCoords(radius, toRadians(phi), toRadians(theta));
    }

    onAdd(map: MapLibreMap, gl: WebGLRenderingContext | WebGL2RenderingContext) {
        this.map = map;

        this.scene = new Scene();
        this.tiles = this.source.scene;
        this.camera = new Camera();

        this.directionalLight = new DirectionalLight(0xffffff, 0.5);
        this.setDirectionalLight(1.15, 90, 0);
        this.scene.add(this.directionalLight);

        this.ambientLight = new AmbientLight(0xffffff, 0.1);
        this.scene.add(this.ambientLight);

        this.scene.add(this.tiles);

        this.renderer = new WebGLRenderer({
            canvas: map.getCanvas(),
            context: gl,
            antialias: true,
        });
        this.renderer.autoClear = false;

        this.source.onAdd(map, this.renderer);
    }

    render(_gl: WebGLRenderingContext | WebGL2RenderingContext, options: CustomRenderMethodInput) {
        const internals = this.map as unknown as MapLibreRenderInternals;
        const tileZoom = internals._camera.transform.tileZoom;
        const inZoomRange = tileZoom >= this.minzoom && tileZoom <= this.maxzoom;
        this.tiles.visible = this.visible && inZoomRange;

        if (!(this.visible && inZoomRange)) {
            return;
        }

        this.syncLighting();
        this.source.updateTiles();
        this.groundLandmarksOnTerrain();
        this.alignCameraToMap(options);

        this.renderer.resetState();
        if (this.needsTranslucentPrepass()) {
            this.renderDepthPrepass();
        }

        this.applyMaterials();
        this.renderer.render(this.scene, this.camera);
        this.map.triggerRepaint();
    }

    // Landmarks are authored with their base at sea level; with 3D terrain the ground rises to
    // the (exaggeration-scaled) elevation. Grounds every landmark each frame, since terrain tiles
    // load progressively and exaggeration can change at runtime.
    private groundLandmarksOnTerrain() {
        for (const tile of this.tiles.children) {
            if (!tile.visible) {
                continue; // off-viewport tiles stay loaded; grounding them each frame costs terrain queries
            }
            tile.traverse((child) => {
                if (isMesh(child)) {
                    this.groundMeshOnTerrain(child);
                }
            });
        }
    }

    // Lifts one landmark to the LOWEST terrain elevation across its footprint, minus a small
    // burial margin: no wall ever floats, and the bottom cap stays below the surface. Grounding is
    // per landmark because terrain can vary by tens of metres across a tile.
    private groundMeshOnTerrain(mesh: Mesh) {
        const samplePoints = this.terrainSamplePoints(mesh);
        if (!samplePoints) {
            return;
        }

        let lowestElevation: number | null = null;
        for (const samplePoint of samplePoints) {
            const elevation = this.map.queryTerrainElevation(samplePoint);
            if (elevation === null) {
                // Terrain is disabled — restore the authored sea-level base.
                mesh.position.z = 0;
                return;
            }
            if (lowestElevation === null || elevation < lowestElevation) {
                lowestElevation = elevation;
            }
        }
        if (lowestElevation !== null) {
            mesh.position.z = lowestElevation - TERRAIN_BURIAL_MARGIN_METRES;
        }
    }

    // `[longitude, latitude]` points spread over the mesh footprint (center, corners, edge
    // midpoints — long walls can dip between corners), derived once from its bounding box.
    private terrainSamplePoints(mesh: Mesh): [number, number][] | null {
        let samplePoints = mesh.userData.terrainSamplePoints as [number, number][] | undefined;
        if (!samplePoints) {
            if (!mesh.geometry.boundingBox) {
                mesh.geometry.computeBoundingBox();
            }
            const bounds = mesh.geometry.boundingBox;
            if (!bounds || bounds.isEmpty()) {
                return null;
            }

            // Mesh positions are relative to the scene origin; the samples need absolute coordinates.
            const anchorX = mesh.position.x + this.sceneOrigin.x;
            const anchorY = mesh.position.y + this.sceneOrigin.y;
            const centerX = (bounds.min.x + bounds.max.x) / 2;
            const centerY = (bounds.min.y + bounds.max.y) / 2;
            samplePoints = [
                [centerX, centerY],
                [bounds.min.x, bounds.min.y],
                [bounds.min.x, bounds.max.y],
                [bounds.max.x, bounds.min.y],
                [bounds.max.x, bounds.max.y],
                [centerX, bounds.min.y],
                [centerX, bounds.max.y],
                [bounds.min.x, centerY],
                [bounds.max.x, centerY],
            ].map(([offsetX, offsetY]) => mercatorMetresToLngLat(anchorX + offsetX, anchorY + offsetY));
            mesh.userData.terrainSamplePoints = samplePoints;
        }
        return samplePoints;
    }

    // maplibre hands custom layers `defaultProjectionData.mainMatrix`, which takes mercator 0..1 for x/y
    // and — in `3d` rendering mode — a conformal z in those same mercator units, not metres. Metre
    // altitudes therefore need the mercator scale factor at the current latitude, hence the extra
    // 1/cos(lat) that z carries and x/y don't.
    private alignCameraToMap(options: CustomRenderMethodInput) {
        const zScale = MERCATOR_UNITS_PER_METRE / Math.cos(toRadians(this.map.getCenter().lat));
        // The scene origin (see ModelsSource.sceneOrigin) is folded in here, in float64.
        const translateX = TRANSLATE_X + MERCATOR_UNITS_PER_METRE * this.sceneOrigin.x;
        const translateY = TRANSLATE_Y - MERCATOR_UNITS_PER_METRE * this.sceneOrigin.y;
        const mapLibreScale = new Matrix4();
        mapLibreScale.set(
            MERCATOR_UNITS_PER_METRE,
            0,
            0,
            translateX,
            0,
            -MERCATOR_UNITS_PER_METRE,
            0,
            translateY,
            0,
            0,
            zScale,
            0,
            0,
            0,
            0,
            1,
        );
        const projection = new Matrix4().fromArray(options.defaultProjectionData.mainMatrix as ArrayLike<number>);
        this.camera.projectionMatrix.copy(projection).multiply(mapLibreScale);
    }

    // Zero until the first tile with meshes sets the source's origin.
    private get sceneOrigin(): NonNullable<ModelsSource['sceneOrigin']> {
        return this.source.sceneOrigin ?? { x: 0, y: 0 };
    }

    // Translucent shading needs a depth pass so overlapping walls blend with the basemap once per pixel.
    private needsTranslucentPrepass(): boolean {
        const layerOpacity = this.fillExtrusionMaterial.uniforms.layerOpacity.value as number;
        return layerOpacity < 1;
    }

    // Per-mesh (not overrideMaterial) so each mesh's alpha mask carves the prepass depth too.
    private renderDepthPrepass() {
        this.tiles.traverse((child) => {
            if (isMesh(child)) {
                child.material = this.maskedFillExtrusionVariant(child)?.depth ?? this.depthPrepassMaterial;
            }
        });
        this.renderer.render(this.scene, this.camera);
    }

    setOpacity(value: number) {
        this.forEachFillExtrusionMaterial((material) => material.setLayerOpacity(value));
    }

    /** Mirrors the basemap's fill-extrusion-vertical-gradient on the landmark shading. */
    setVerticalGradient(enabled: boolean) {
        this.forEachFillExtrusionMaterial((material) => material.setVerticalGradient(enabled));
    }

    getMaterial(mesh: Mesh): FillExtrusionMaterial {
        return this.maskedFillExtrusionVariant(mesh)?.color ?? this.fillExtrusionMaterial;
    }

    // Fill-extrusion variant masked by the mesh's own texture alpha; null for untextured meshes.
    private maskedFillExtrusionVariant(mesh: Mesh) {
        const original = mesh.userData.originalMaterial as MeshStandardMaterial | undefined;
        const map = original?.map;
        if (!map) {
            return null;
        }

        let variant = this.maskedFillExtrusionMaterials.get(map);
        if (!variant) {
            const alphaMask = { map, cutoff: original.alphaTest || 0.1 };
            variant = {
                color: new FillExtrusionMaterial(alphaMask),
                depth: new FillExtrusionDepthMaterial(alphaMask),
            };
            variant.color.copyShadingFrom(this.fillExtrusionMaterial);
            this.maskedFillExtrusionMaterials.set(map, variant);
        }
        return variant;
    }

    private forEachFillExtrusionMaterial(apply: (material: FillExtrusionMaterial) => void) {
        apply(this.fillExtrusionMaterial);
        this.maskedFillExtrusionMaterials.forEach((variant) => apply(variant.color));
    }

    private syncLighting() {
        // The maplibre style light is private API; fall back to the onAdd defaults when absent.
        const internals = this.map as unknown as MapLibreRenderInternals;
        const light = internals.style?.light;
        const properties = light?.properties;
        const cartesianPosition = light?.getCartesianPosition?.();
        if (!properties || !cartesianPosition) {
            return;
        }

        try {
            const intensity = properties.get('intensity');
            // `* π` cancels Three.js's internal 1/π Lambert factor, matching maplibre's shading range.
            this.directionalLight.intensity = intensity * Math.PI;
            this.ambientLight.intensity = (1 - intensity) * Math.PI;

            // The cartesian style light maps into the scene's x-east/y-north frame with x negated.
            const position = { x: -cartesianPosition[0], y: cartesianPosition[1], z: cartesianPosition[2] };
            this.directionalLight.position.set(position.x, position.y, position.z);

            // Viewport-anchored lights counter-rotate with the bearing so camera-facing walls
            // stay lit at every bearing, matching maplibre's rendered output.
            const anchor = properties.get('anchor');
            const bearingInRadians = anchor === 'viewport' ? -(internals._camera.transform.bearingInRadians ?? 0) : 0;
            const color = properties.get('color');
            this.forEachFillExtrusionMaterial((material) =>
                material.setLight(position, bearingInRadians, intensity, color),
            );
        } catch {
            // Internal API surface changed — keep the configured defaults.
        }
    }

    private applyMaterials() {
        this.forEachFillExtrusionMaterial((material) => material.setDiffuseColor(this.diffuseColor));

        this.tiles.traverse((child) => {
            if (isMesh(child)) {
                child.material = this.getMaterial(child);
            }
        });
    }
}
