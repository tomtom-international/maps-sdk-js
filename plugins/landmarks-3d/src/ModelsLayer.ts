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
import { isMesh } from './utils';

// EPSG:3857 metres → mercator [0..1]; Z additionally scales by 1/cos(lat) per frame in render().
const TILE_SCALE = 1 / (2 * 20037508.34);
const TRANSLATE_X = 0.5;
const TRANSLATE_Y = 0.5;

const toRadians = (degrees: number): number => (degrees * Math.PI) / 180;

// Directional light strength for the landmark shading, tuned to blend with the basemap buildings.
const LANDMARK_LIGHT_INTENSITY = 0.5;

// Subset of the private maplibre-gl internals this layer needs, reached via an `unknown` cast.
interface MapLibreRenderInternals {
    transform: { tileZoom: number; bearingInRadians?: number };
    style: {
        light?: {
            properties?: {
                get(key: 'intensity'): number;
                get(key: 'position'): { x: number; y: number; z: number };
                get(key: 'anchor'): 'map' | 'viewport';
                get(key: 'color'): { r: number; g: number; b: number };
            };
        };
    };
}

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
        const tileZoom = internals.transform.tileZoom;
        const inZoomRange = tileZoom >= this.minzoom && tileZoom <= this.maxzoom;
        this.tiles.visible = this.visible && inZoomRange;

        if (!(this.visible && inZoomRange)) {
            return;
        }

        this.syncLighting();
        this.source.updateTiles();
        this.alignCameraToMap(options);

        this.renderer.resetState();
        if (this.needsTranslucentPrepass()) {
            this.renderDepthPrepass();
        }

        this.applyMaterials();
        this.renderer.render(this.scene, this.camera);
        this.map.triggerRepaint();
    }

    // Canonical maplibre v5 pattern: MVP*scale on camera.projectionMatrix, via mainMatrix because v5 flattens Z.
    private alignCameraToMap(options: CustomRenderMethodInput) {
        const latitudeInRadians = (this.map.getCenter().lat * Math.PI) / 180;
        const zScale = TILE_SCALE / Math.cos(latitudeInRadians);
        const mapLibreScale = new Matrix4();
        mapLibreScale.set(TILE_SCALE, 0, 0, TRANSLATE_X, 0, -TILE_SCALE, 0, TRANSLATE_Y, 0, 0, zScale, 0, 0, 0, 0, 1);
        const projection = new Matrix4().fromArray(options.defaultProjectionData.mainMatrix as ArrayLike<number>);
        this.camera.projectionMatrix.copy(projection).multiply(mapLibreScale);
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
        const properties = internals.style?.light?.properties;
        if (!properties) {
            return;
        }

        try {
            // Fixed strength tuned to match the basemap buildings (the standard styles light at ~0.5).
            const intensity = LANDMARK_LIGHT_INTENSITY;
            // `* π` cancels Three.js's internal 1/π Lambert factor, matching maplibre's shading range.
            this.directionalLight.intensity = intensity * Math.PI;
            this.ambientLight.intensity = (1 - intensity) * Math.PI;

            const position = properties.get('position');
            this.directionalLight.position.set(position.x, position.y, position.z);

            // Viewport-anchored lights rotate with the map bearing, like maplibre's painter.
            const anchor = properties.get('anchor');
            const bearingInRadians = anchor === 'viewport' ? (internals.transform.bearingInRadians ?? 0) : 0;
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
