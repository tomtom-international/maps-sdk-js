import { TomTomConfig } from '@tomtom-org/maps-sdk/core';
import {
    HillshadeModule,
    type StandardStyleID,
    StylingModule,
    standardStyleIDs,
    TomTomMap,
} from '@tomtom-org/maps-sdk/map';
import { MapEffects } from '@tomtom-org/maps-sdk-plugin-map-effects';
import './style.css';
import { API_KEY } from './config';
import { initTogglePanel } from './togglePanel';

// (Set your own API key when working in your own environment)
TomTomConfig.instance.put({ apiKey: API_KEY, language: 'en-GB' });

// A camera aimed at the relief rather than at a place: the summit in the middle of the screen, the
// bearing of the valley it is usually photographed from.
type Viewpoint = {
    label: string;
    center: [number, number];
    zoom: number;
    bearing: number;
};

const viewpoints: Viewpoint[] = [
    { label: 'Matterhorn, Switzerland', center: [7.6586, 45.9763], zoom: 12.6, bearing: 178 },
    { label: 'Mont Blanc, France', center: [6.8652, 45.8326], zoom: 12.2, bearing: 320 },
    { label: 'Grand Canyon, United States', center: [-112.14, 36.1], zoom: 12.2, bearing: 0 },
    { label: 'Mount Fuji, Japan', center: [138.7274, 35.3606], zoom: 11.4, bearing: 172 },
];

const INITIAL_PITCH = 72;

// The satellite basemap is a daylit photograph, but its dark labels put the style in the dark
// theme, whose night sky sits oddly above sunlit rock. Every other style keeps the sky its own
// theme picks.
const DAYLIGHT_SKY_COLOR = '#88c6fc';
const DAYLIGHT_HORIZON_COLOR = '#ffffff';

// What the focus knob is choosing, since the number itself means nothing: the scale is distance
// across whatever the frame shows, so only its ends can be named exactly.
const focusLabel = (focus: number) => {
    if (focus <= 0) return 'Nearest';
    if (focus >= 1) return 'Farthest';

    return focus < 0.5 ? 'Near' : 'Far';
};

(async () => {
    const [initialViewpoint] = viewpoints;

    const map = new TomTomMap({
        style: 'satellite',
        mapLibre: {
            container: 'sdk-map',
            center: initialViewpoint.center,
            zoom: initialViewpoint.zoom,
            bearing: initialViewpoint.bearing,
            pitch: INITIAL_PITCH,
            // MapLibre stops at 60° by default, which is where terrain starts to read as relief.
            maxPitch: 85,
            // The depth of field reads the rendered map back as a texture, which MapLibre allows
            // only when asked.
            canvasContextAttributes: { preserveDrawingBuffer: true },
        },
    });

    const [styling, hillshading] = await Promise.all([
        StylingModule.get(map, { 'view.terrain': true, 'view.terrainExaggeration': 1.4, 'view.sky': true }),
        // The relief the terrain is raised from, shaded: the same elevation source, drawn rather
        // than displaced, which is what keeps a slope readable where the camera flattens it.
        HillshadeModule.get(map, { visible: true }),
    ]);

    // The effects plugin works on the rendered pixels, so it needs nothing from the style and
    // survives every switch below.
    const effects = new MapEffects(map);

    const viewpointSelector = document.querySelector('#ui-viewpoint') as HTMLSelectElement;
    const styleSelector = document.querySelector('#ui-mapStyle') as HTMLSelectElement;
    const terrain = document.querySelector('#ui-terrain') as HTMLInputElement;
    const hillshade = document.querySelector('#ui-hillshade') as HTMLInputElement;
    const sky = document.querySelector('#ui-sky') as HTMLInputElement;
    const depthOfField = document.querySelector('#ui-depthOfField') as HTMLInputElement;
    const exaggeration = document.querySelector('#ui-exaggeration') as HTMLInputElement;
    const exaggerationValue = document.querySelector('#ui-exaggerationValue') as HTMLElement;
    const pitch = document.querySelector('#ui-pitch') as HTMLInputElement;
    const pitchValue = document.querySelector('#ui-pitchValue') as HTMLElement;
    const followPointer = document.querySelector('#ui-followPointer') as HTMLInputElement;
    const focus = document.querySelector('#ui-focus') as HTMLInputElement;
    const focusValue = document.querySelector('#ui-focusValue') as HTMLElement;
    const band = document.querySelector('#ui-band') as HTMLInputElement;
    const bandValue = document.querySelector('#ui-bandValue') as HTMLElement;
    const blur = document.querySelector('#ui-blur') as HTMLInputElement;
    const blurValue = document.querySelector('#ui-blurValue') as HTMLElement;

    // Every knob writes the whole effect, so the sliders are live before the toggle and keep their
    // meaning after it: off is simply an intensity of 0.
    const applyDepthOfField = () =>
        effects.set({
            'depthOfField.intensity': depthOfField.checked ? Number(blur.value) : 0,
            'depthOfField.focus': Number(focus.value),
            'depthOfField.band': Number(band.value),
        });

    const applySkyOf = (styleId: StandardStyleID) => {
        if (styleId === 'satellite') {
            styling.set('view.skyColor', DAYLIGHT_SKY_COLOR);
            styling.set('view.horizonColor', DAYLIGHT_HORIZON_COLOR);
            return;
        }

        styling.reset('view.skyColor');
        styling.reset('view.horizonColor');
    };

    viewpoints.forEach((viewpoint, index) => viewpointSelector.add(new Option(viewpoint.label, String(index))));
    standardStyleIDs.forEach((styleId) => styleSelector.add(new Option(styleId)));
    styleSelector.value = 'satellite';
    applySkyOf('satellite');

    viewpointSelector.addEventListener('change', () => {
        const { center, zoom, bearing } = viewpoints[Number(viewpointSelector.value)];
        map.mapLibreMap.flyTo({ center, zoom, bearing, pitch: Number(pitch.value), duration: 4000 });
    });

    // The terrain, its exaggeration and the sky are styling settings rather than camera state, so
    // they survive this switch: the module re-applies them on top of every style it loads.
    styleSelector.addEventListener('change', () => {
        const styleId = styleSelector.value as StandardStyleID;
        map.setStyle(styleId);
        applySkyOf(styleId);
    });

    terrain.addEventListener('change', () => styling.set('view.terrain', terrain.checked));
    sky.addEventListener('change', () => styling.set('view.sky', sky.checked));
    hillshade.addEventListener('change', () => hillshading.setVisible(hillshade.checked));

    depthOfField.addEventListener('change', applyDepthOfField);

    const showFocus = () => {
        focusValue.textContent = focusLabel(Number(focus.value));
        applyDepthOfField();
    };

    focus.addEventListener('input', showFocus);

    // Depth runs up the screen on a tilted map, and the focus knob is read across what the frame
    // shows — so the row the pointer is on *is* the distance to focus on, with no unprojection and
    // no elevation query. A tap gives a tablet the same thing a hover gives a mouse.
    const focusAtPointer = ({ point }: { point: { y: number } }) => {
        if (!followPointer.checked || !depthOfField.checked) return;

        const height = Math.max(map.mapLibreMap.getCanvas().clientHeight, 1);
        focus.value = String(Math.min(Math.max(1 - point.y / height, 0), 1));
        showFocus();
    };

    map.mapLibreMap.on('mousemove', focusAtPointer);
    map.mapLibreMap.on('click', focusAtPointer);
    followPointer.addEventListener('change', () => {
        focus.disabled = followPointer.checked;
    });

    band.addEventListener('input', () => {
        bandValue.textContent = Number(band.value) === 0 ? 'One plane' : `${Math.round(Number(band.value) * 100)}%`;
        applyDepthOfField();
    });

    blur.addEventListener('input', () => {
        blurValue.textContent = `${blur.value}px`;
        applyDepthOfField();
    });

    exaggeration.addEventListener('input', () => {
        exaggerationValue.textContent = exaggeration.value;
        styling.set('view.terrainExaggeration', Number(exaggeration.value));
    });

    pitch.addEventListener('input', () => {
        pitchValue.textContent = `${pitch.value}°`;
        map.mapLibreMap.setPitch(Number(pitch.value));
    });

    initTogglePanel();
})();
