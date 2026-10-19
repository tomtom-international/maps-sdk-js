import { TomTomConfig } from '@tomtom-org/maps-sdk/core';
import {
    BaseMapModule,
    getKnob,
    resetKnob,
    type StandardStyleID,
    StylingFoundationsModule,
    setKnob,
    standardStyleIDs,
    stylingFoundationsKnobCatalogue,
    TomTomMap,
} from '@tomtom-org/maps-sdk/map';
import { Landmarks3D, landmarks3DKnobCatalogue } from '@tomtom-org/maps-sdk-plugin-landmarks-3d';
import './style.css';
import { API_KEY } from './config';
import { initTogglePanel } from './togglePanel';

// (Set your own API key when working in your own environment)
TomTomConfig.instance.put({ apiKey: API_KEY, language: 'en-GB' });

// A canvas turns any opaque CSS colour, such as the style's `hsl(…)`, into the `#rrggbb` a colour input takes.
const canvasContext = document.createElement('canvas').getContext('2d') as CanvasRenderingContext2D;
const toHex = (cssColor: string): string => {
    canvasContext.fillStyle = cssColor;
    return canvasContext.fillStyle;
};

(async () => {
    const map = new TomTomMap({
        mapLibre: {
            container: 'sdk-map',
            center: [4.8969, 52.3757],
            zoom: 15.94,
            pitch: 60,
            bearing: 8,
        },
    });
    const styling = await StylingFoundationsModule.get(map);
    // Most standard styles ship their 3D buildings hidden; they put the landmarks in a 3D city.
    await BaseMapModule.get(map, { groups: { buildings3D: { visible: true } } });

    // Streams Orbis 3D Landmarks tiles. Every knob left unset follows the base map's 3D buildings.
    const landmarks = new Landmarks3D(map);

    const builtUp = document.querySelector('#ui-builtUp') as HTMLInputElement;
    const color = document.querySelector('#ui-color') as HTMLInputElement;
    const opacity = document.querySelector('#ui-opacity') as HTMLInputElement;
    const opacityValue = document.querySelector('#ui-opacity-value') as HTMLElement;
    const gradient = document.querySelector('#ui-verticalGradient') as HTMLInputElement;

    // map.mapColors holds the style's own colour where none is set, and getKnob reports a knob left
    // unset as the base map's 3D buildings draw it, so the controls always show what the map draws.
    const showBuiltUp = () => {
        if (map.mapColors.artificial) builtUp.value = toHex(map.mapColors.artificial);
    };
    const showLook = () => {
        color.value = toHex(String(getKnob(landmarks, landmarks3DKnobCatalogue, 'color')));
        opacity.value = String(getKnob(landmarks, landmarks3DKnobCatalogue, 'opacity'));
        opacityValue.textContent = opacity.value;
        gradient.checked = getKnob(landmarks, landmarks3DKnobCatalogue, 'verticalGradient') === true;
    };
    const showAll = () => {
        showBuiltUp();
        showLook();
    };
    map.mapLibreMap.once('idle', showAll);

    color.addEventListener('input', () => setKnob(landmarks, landmarks3DKnobCatalogue, 'color', color.value));
    opacity.addEventListener('input', () => {
        opacityValue.textContent = opacity.value;
        setKnob(landmarks, landmarks3DKnobCatalogue, 'opacity', Number(opacity.value));
    });
    gradient.addEventListener('change', () =>
        setKnob(landmarks, landmarks3DKnobCatalogue, 'verticalGradient', gradient.checked),
    );
    document.querySelector('#ui-follow')?.addEventListener('click', () => {
        landmarks.resetConfig();
        showLook();
    });

    // The built-up colour recolours the base map's 3D buildings, and the landmarks' unset knobs with
    // them. A drag fires `input` faster than a restyle runs: one per animation frame, the last colour winning.
    let builtUpFrame = 0;
    builtUp.addEventListener('input', () => {
        cancelAnimationFrame(builtUpFrame);
        builtUpFrame = requestAnimationFrame(() => {
            styling.setMapColors({ artificial: builtUp.value });
            showLook();
        });
    });
    document.querySelector('#ui-builtUp-reset')?.addEventListener('click', () => {
        resetKnob(styling, stylingFoundationsKnobCatalogue, 'colors.artificial');
        showAll();
    });

    const basemapSelector = document.querySelector('#ui-basemap') as HTMLSelectElement;
    standardStyleIDs.forEach((id) => basemapSelector.add(new Option(id)));
    basemapSelector.addEventListener('change', async () => {
        await map.setStyle(basemapSelector.value as StandardStyleID);
        showAll();
    });

    initTogglePanel();
})();
