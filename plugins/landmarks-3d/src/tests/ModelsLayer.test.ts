import type { CustomRenderMethodInput, Map as MapLibreMap } from 'maplibre-gl';
import {
    AmbientLight,
    BoxGeometry,
    BufferGeometry,
    Camera,
    DirectionalLight,
    Group,
    Matrix4,
    Mesh,
    MeshStandardMaterial,
    Texture,
    Vector3,
} from 'three';
import { describe, expect, it, vi } from 'vitest';
import { ModelsLayer } from '../ModelsLayer';
import { MERCATOR_UNITS_PER_METRE, mercatorMetresToLngLat } from '../utils';

// Central Innsbruck in EPSG:3857 metres.
const SCENE_ORIGIN = { x: 1268240, y: 5985996 };

// The private steps `render()` runs each frame, reached directly as the ModelsSource tests do.
type ModelsLayerInternals = {
    groundLandmarksOnTerrain(): void;
    alignCameraToMap(options: CustomRenderMethodInput): void;
    syncLighting(): void;
};

const internalsOf = (layer: ModelsLayer): ModelsLayerInternals => layer as unknown as ModelsLayerInternals;

const makeLayer = (map: Partial<MapLibreMap>): ModelsLayer => {
    const layer = new ModelsLayer(
        { id: 'landmarks', type: 'models', source: 'landmarks' },
        { type: 'models', tiles: [] },
    );
    layer.map = map as MapLibreMap;
    return layer;
};

// A 20 × 10 m footprint, 30 m tall, standing on its base like a landmark mesh.
const addLandmark = (
    layer: ModelsLayer,
    geometry: BufferGeometry = new BoxGeometry(20, 10, 30).translate(0, 0, 15),
) => {
    const mesh = new Mesh(geometry);
    mesh.position.set(100, 50, 0);
    const tile = new Group();
    tile.add(mesh);
    layer.tiles.add(tile);
    return { mesh, tile };
};

describe('ModelsLayer terrain grounding', () => {
    it('lowers a landmark onto the lowest of its footprint samples, minus the burial margin', () => {
        const elevations = [610, 605, 600, 620, 615, 603, 608, 611, 609];
        const queryTerrainElevation = vi.fn((_lngLat: [number, number]) => elevations.shift() ?? null);
        const layer = makeLayer({ queryTerrainElevation });
        layer.source.sceneOrigin = SCENE_ORIGIN;
        const { mesh } = addLandmark(layer);

        internalsOf(layer).groundLandmarksOnTerrain();

        expect(mesh.position.z).toBe(599.5);
        expect(queryTerrainElevation).toHaveBeenCalledTimes(9);
        // The first sample is the footprint centre, back in absolute coordinates.
        const [longitude, latitude] = mercatorMetresToLngLat(SCENE_ORIGIN.x + 100, SCENE_ORIGIN.y + 50);
        const [firstSample] = queryTerrainElevation.mock.calls[0];
        expect(firstSample[0]).toBeCloseTo(longitude, 9);
        expect(firstSample[1]).toBeCloseTo(latitude, 9);
    });

    it('returns a landmark to its sea-level base once the terrain is off', () => {
        const queryTerrainElevation = vi.fn((_lngLat: [number, number]): number | null => 600);
        const layer = makeLayer({ queryTerrainElevation });
        layer.source.sceneOrigin = SCENE_ORIGIN;
        const { mesh } = addLandmark(layer);
        internalsOf(layer).groundLandmarksOnTerrain();
        expect(mesh.position.z).toBe(599.5);

        queryTerrainElevation.mockReturnValue(null);
        internalsOf(layer).groundLandmarksOnTerrain();

        expect(mesh.position.z).toBe(0);
    });

    it('skips tiles outside the viewport and meshes with no footprint', () => {
        const queryTerrainElevation = vi.fn(() => 600);
        const layer = makeLayer({ queryTerrainElevation });
        const { tile } = addLandmark(layer);
        tile.visible = false;
        const { mesh: emptyMesh } = addLandmark(layer, new BufferGeometry());

        internalsOf(layer).groundLandmarksOnTerrain();

        expect(queryTerrainElevation).not.toHaveBeenCalled();
        expect(emptyMesh.position.z).toBe(0);
    });
});

describe('ModelsLayer.alignCameraToMap', () => {
    const identity = {
        defaultProjectionData: { mainMatrix: new Matrix4().toArray() },
    } as unknown as CustomRenderMethodInput;

    const alignedLayer = (latitude: number, sceneOrigin: { x: number; y: number } | null) => {
        const layer = makeLayer({ getCenter: () => ({ lat: latitude }) as ReturnType<MapLibreMap['getCenter']> });
        layer.camera = new Camera();
        layer.source.sceneOrigin = sceneOrigin;
        internalsOf(layer).alignCameraToMap(identity);
        return layer;
    };

    it('folds the scene origin back in, so a mesh at the origin lands on its mercator coordinate', () => {
        const layer = alignedLayer(0, SCENE_ORIGIN);

        const projected = new Vector3(0, 0, 0).applyMatrix4(layer.camera.projectionMatrix);
        const [longitude, latitude] = mercatorMetresToLngLat(SCENE_ORIGIN.x, SCENE_ORIGIN.y);
        const latitudeInRadians = (latitude * Math.PI) / 180;
        expect(projected.x).toBeCloseTo((longitude + 180) / 360, 12);
        expect(projected.y).toBeCloseTo(
            0.5 - Math.log(Math.tan(Math.PI / 4 + latitudeInRadians / 2)) / (2 * Math.PI),
            12,
        );
    });

    it('centres an unset origin on the world and scales metre altitudes by the latitude', () => {
        const elements = alignedLayer(60, null).camera.projectionMatrix.elements;

        expect(elements[12]).toBe(0.5);
        expect(elements[13]).toBe(0.5);
        expect(elements[10]).toBeCloseTo(2 * MERCATOR_UNITS_PER_METRE, 18);
    });
});

describe('ModelsLayer lighting', () => {
    const litLayer = (anchor: 'map' | 'viewport') => {
        const properties = { intensity: 0.4, anchor, color: { r: 1, g: 1, b: 1 } };
        const layer = makeLayer({
            style: {
                light: {
                    getCartesianPosition: () => [1, 2, 3],
                    properties: { get: (key: keyof typeof properties) => properties[key] },
                },
            },
            _camera: { transform: { bearingInRadians: Math.PI / 2 } },
        } as unknown as Partial<MapLibreMap>);
        layer.directionalLight = new DirectionalLight();
        layer.ambientLight = new AmbientLight();
        internalsOf(layer).syncLighting();
        return layer;
    };

    it("takes the style light's intensity, and its cartesian position with x mirrored into the scene frame", () => {
        const layer = litLayer('map');

        expect(layer.directionalLight.position.toArray()).toEqual([-1, 2, 3]);
        expect(layer.directionalLight.intensity).toBeCloseTo(0.4 * Math.PI, 12);
        expect(layer.ambientLight.intensity).toBeCloseTo(0.6 * Math.PI, 12);
        const shading = layer.getMaterial(new Mesh()).uniforms;
        expect(shading.lightIntensity.value).toBe(0.4);
        expect((shading.lightPosition.value as Vector3).toArray()).toEqual([-1, 2, 3]);
    });

    it('counter-rotates a viewport-anchored light by the map bearing', () => {
        const lightPosition = litLayer('viewport').getMaterial(new Mesh()).uniforms.lightPosition.value as Vector3;

        expect(lightPosition.x).toBeCloseTo(2, 12);
        expect(lightPosition.y).toBeCloseTo(1, 12);
        expect(lightPosition.z).toBe(3);
    });
});

describe('ModelsLayer.setVerticalGradient', () => {
    it('reaches the shared material and every alpha-masked variant, existing or created later', () => {
        const layer = makeLayer({});
        const texturedMesh = (map: Texture) => {
            const mesh = new Mesh(new BoxGeometry());
            mesh.userData.originalMaterial = new MeshStandardMaterial({ map });
            return mesh;
        };
        const existingVariant = layer.getMaterial(texturedMesh(new Texture()));

        layer.setVerticalGradient(false);

        expect(layer.getMaterial(new Mesh()).uniforms.verticalGradient.value).toBe(0);
        expect(existingVariant.uniforms.verticalGradient.value).toBe(0);
        expect(layer.getMaterial(texturedMesh(new Texture())).uniforms.verticalGradient.value).toBe(0);
    });
});
