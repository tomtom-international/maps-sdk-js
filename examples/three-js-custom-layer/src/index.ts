import { TomTomConfig } from '@tomtom-org/maps-sdk/core';
import { BaseMapModule, type EventState, localFrameMatrix, TomTomMap } from '@tomtom-org/maps-sdk/map';
import { type CustomLayerInterface, type Point2D, Popup } from 'maplibre-gl';
import {
    BoxGeometry,
    Camera,
    Color,
    DirectionalLight,
    HemisphereLight,
    InstancedMesh,
    Matrix4,
    MeshStandardMaterial,
    Raycaster,
    Scene,
    Vector3,
    WebGLRenderer,
} from 'three';
import './style.css';
import { API_KEY } from './config';

// (Set your own API key when working in your own environment)
TomTomConfig.instance.put({ apiKey: API_KEY, language: 'en-GB' });

// Dam Square, Amsterdam: the scene's x runs east, y north and z up from here, in metres.
const origin: [number, number] = [4.8932, 52.3731];

const map = new TomTomMap({
    mapLibre: { container: 'sdk-map', center: origin, zoom: 16.8, pitch: 60, bearing: -30 },
});

// Twelve columns in a ring 90 metres across, rising from 12 to 45 metres.
const columns = Array.from({ length: 12 }, (_, index) => {
    const angle = (index / 12) * 2 * Math.PI;
    return {
        east: Math.cos(angle) * 45,
        north: Math.sin(angle) * 45,
        height: 12 + index * 3,
        color: new Color().setHSL(index / 12, 0.75, 0.55),
    };
});

// One mesh draws every column: a unit-high box, stretched and placed per instance.
const mesh = new InstancedMesh(new BoxGeometry(8, 8, 1), new MeshStandardMaterial(), columns.length);
columns.forEach(({ east, north, height, color }, index) => {
    mesh.setMatrixAt(index, new Matrix4().makeTranslation(east, north, height / 2).scale(new Vector3(1, 1, height)));
    mesh.setColorAt(index, color);
});
const scene = new Scene();
const sun = new DirectionalLight(0xffffff, 2);
sun.position.set(-1, -2, 3);
scene.add(mesh, sun, new HemisphereLight(0xffffff, 0x444444, 1.5));

const camera = new Camera();
let renderer: WebGLRenderer;
// The matrix of the last frame drawn, which the hit test casts the pointer's ray through.
let frameMatrix: Float64Array | undefined;

const threeLayer: CustomLayerInterface = {
    id: 'three-scene',
    type: 'custom',
    renderingMode: '3d',
    onAdd: (mapLibreMap, gl) => {
        renderer ??= new WebGLRenderer({ canvas: mapLibreMap.getCanvas(), context: gl, antialias: true });
        // Draw over the map MapLibre has drawn so far, instead of clearing it.
        renderer.autoClear = false;
    },
    render: (_gl, options) => {
        frameMatrix = localFrameMatrix(options.defaultProjectionData.mainMatrix, origin, {
            centerLatitude: map.mapLibreMap.getCenter().lat,
        });
        camera.projectionMatrix.fromArray(frameMatrix);
        camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert();
        // MapLibre changed the WebGL state three.js remembers since its last frame.
        renderer.resetState();
        renderer.render(scene, camera);
    },
};

// The pointer's ray into the scene, from the near plane to the far one, through the last frame drawn.
const raycaster = new Raycaster();
const inverseFrameMatrix = new Matrix4();
const pickColumns = (point: Point2D) => {
    if (!frameMatrix) return [];
    const { clientWidth, clientHeight } = map.mapLibreMap.getCanvas();
    const [x, y] = [(point.x / clientWidth) * 2 - 1, 1 - (point.y / clientHeight) * 2];
    inverseFrameMatrix.fromArray(frameMatrix).invert();
    const near = new Vector3(x, y, -1).applyMatrix4(inverseFrameMatrix);
    const far = new Vector3(x, y, 1).applyMatrix4(inverseFrameMatrix);
    raycaster.ray.set(near, far.sub(near).normalize());
    // The columns the ray passes through, the nearest first, each once.
    const ids = new Set(raycaster.intersectObject(mesh).map(({ instanceId }) => instanceId as number));
    return [...ids].map((id) => ({ id, properties: { height: columns[id].height } }));
};

const white = new Color('white');
const showState = (index: number, state: EventState | undefined) => {
    const lit = state === 'hover' || state === 'long-hover' || state === 'click';
    mesh.setColorAt(index, lit ? columns[index].color.clone().lerp(white, 0.5) : columns[index].color);
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    map.mapLibreMap.triggerRepaint();
};

// Under the 3D buildings it shares its depth with, and back there after every style switch.
const columnsLayer = map.addCustomLayer(threeLayer, {
    beforeLayerConfig: 'lowest3D',
    hitTest: pickColumns,
    setState: showState,
});

// Not closed by MapLibre on every click, which would close it again as it moves to another column.
const popup = new Popup({ closeButton: false, closeOnClick: false, offset: 12 });
columnsLayer.events.on('click', (column, lngLat) => {
    popup.setLngLat(lngLat).setText(`${column.properties?.height} m tall`).addTo(map.mapLibreMap);
});

(async () => {
    const baseMap = await BaseMapModule.get(map, { events: { cursorOnHover: 'default' } });
    baseMap.setVisible(true, { layerGroups: { show: 'only', values: ['buildings3D'] } });
    // A click on the ground closes the popup. Labels and 3D buildings draw above the columns, so a handler
    // on them would take the clicks of the columns they overlap.
    baseMap.events
        .where({ layerGroups: { show: 'only', values: ['land', 'water', 'buildings2D', 'roads', 'railways'] } })
        .on('click', () => popup.remove());
})();
