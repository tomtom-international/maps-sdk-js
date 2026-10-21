import { TomTomConfig } from '@tomtom-org/maps-sdk/core';
import {
    BaseMapModule,
    getKnob,
    knobEntryOf,
    resetKnob,
    type StandardStyleID,
    StylingFoundationsModule,
    setKnob,
    standardStyleIDs,
    stylingFoundationsKnobCatalogue,
    TomTomMap,
} from '@tomtom-org/maps-sdk/map';
import {
    Buildings3D,
    Landmarks3D,
    type Landmarks3DKnobId,
    landmarks3DKnobCatalogue,
} from '@tomtom-org/maps-sdk-plugin-landmarks-3d';
import type { CameraOptions } from 'maplibre-gl';
import './style.css';
import { API_KEY } from './config';
import { type KnobControl, knobControl, perFrame, toHex } from './knobControls';
import { initTogglePanel } from './togglePanel';

// (Set your own API key when working in your own environment)
TomTomConfig.instance.put({ apiKey: API_KEY, language: 'en-GB' });

// Each landmark framed from where its shape reads best.
const places: Record<string, CameraOptions> = {
    'Dam Square, Amsterdam': { center: [4.8969, 52.3757], zoom: 15.94, pitch: 60, bearing: 8 },
    'Eiffel Tower, Paris': { center: [2.293, 48.8594], zoom: 15.4, pitch: 40, bearing: -50 },
    'Palace of Westminster, London': { center: [-0.1246, 51.4995], zoom: 16.5, pitch: 60, bearing: 60 },
    'Sagrada Família, Barcelona': { center: [2.1744, 41.4036], zoom: 16.8, pitch: 55, bearing: 20 },
    'Colosseum, Rome': { center: [12.4922, 41.8902], zoom: 16.6, pitch: 55, bearing: 30 },
    'Burj Khalifa, Dubai': { center: [55.2759, 25.2012], zoom: 15, pitch: 35, bearing: 20 },
    'Sydney Opera House': { center: [151.2149, -33.8572], zoom: 17, pitch: 55, bearing: 160 },
};

// Every landmarks knob but `visible`, with the label its control takes.
const landmarkKnobs: [Landmarks3DKnobId, string][] = [
    ['color', 'Colour'],
    ['texture', 'Texture'],
    ['opacity', 'Opacity'],
    ['verticalGradient', 'Walls darken towards the ground'],
    ['minZoom', 'Lowest zoom'],
    ['maxZoom', 'Highest zoom'],
];

(async () => {
    const [firstPlace] = Object.values(places);
    const map = new TomTomMap({ mapLibre: { container: 'sdk-map', ...firstPlace } });
    const styling = await StylingFoundationsModule.get(map);
    // Most standard styles ship their 3D buildings hidden; they put the landmarks in a 3D city.
    await BaseMapModule.get(map, { groups: { buildings3D: { visible: true } } });

    // Streams Orbis 3D Landmarks tiles. Every knob left unset follows the map's 3D buildings: the
    // base map's, or those of Buildings3D while the toggle shows them.
    const landmarks = new Landmarks3D(map);

    // One control per catalogue entry: its kind picks the control, its range the slider's, its
    // description the tooltip. getKnob reports a knob left unset as the map's 3D buildings draw it,
    // so the controls always show what the map draws.
    const controls = new Map<Landmarks3DKnobId, KnobControl>();
    const showLook = () => {
        for (const [id, control] of controls) control.show(getKnob(landmarks, landmarks3DKnobCatalogue, id));
    };
    const landmarksSection = document.querySelector('#ui-landmarks') as HTMLElement;
    for (const [id, label] of landmarkKnobs) {
        const control = knobControl(knobEntryOf(landmarks3DKnobCatalogue, id), label, (value) =>
            setKnob(landmarks, landmarks3DKnobCatalogue, id, value as never),
        );
        controls.set(id, control);
        landmarksSection.append(control.element);
    }
    document.querySelector('#ui-follow')?.addEventListener('click', () => {
        landmarks.resetConfig();
        showLook();
    });

    // map.mapColors holds the style's own colour where none is set.
    const builtUp = document.querySelector('#ui-builtUp') as HTMLInputElement;
    const showBuiltUp = () => {
        if (map.mapColors.artificial) builtUp.value = toHex(map.mapColors.artificial);
    };
    const showAll = () => {
        showBuiltUp();
        showLook();
    };
    map.mapLibreMap.once('idle', showAll);

    // The built-up colour recolours the base map's 3D buildings, and the landmarks' unset knobs with them.
    const builtUpApplier = perFrame((value) => {
        styling.setMapColors({ artificial: value });
        showLook();
    });
    builtUp.addEventListener('input', () => builtUpApplier.queue(builtUp.value));
    builtUp.addEventListener('change', builtUpApplier.flush);
    document.querySelector('#ui-builtUp-reset')?.addEventListener('click', () => {
        resetKnob(styling, stylingFoundationsKnobCatalogue, 'colors.artificial');
        showAll();
    });

    // Buildings3D draws the city around the landmarks under one sun: each casts its shadows on the other.
    // Their walls then have no gradient to toggle.
    const buildings = new Buildings3D(map);
    const buildingsToggle = document.querySelector('#ui-buildings3D') as HTMLInputElement;
    const gradientInput = controls.get('verticalGradient')?.element.querySelector('input') as HTMLInputElement;
    gradientInput.disabled = true;
    buildingsToggle.addEventListener('change', () => {
        buildings.setVisible(buildingsToggle.checked);
        gradientInput.disabled = buildingsToggle.checked;
        showLook();
    });

    const placeSelector = document.querySelector('#ui-place') as HTMLSelectElement;
    Object.keys(places).forEach((name) => placeSelector.add(new Option(name)));
    placeSelector.addEventListener('change', () => map.mapLibreMap.flyTo({ ...places[placeSelector.value], speed: 2 }));

    const basemapSelector = document.querySelector('#ui-basemap') as HTMLSelectElement;
    standardStyleIDs.forEach((id) => basemapSelector.add(new Option(id)));
    basemapSelector.addEventListener('change', async () => {
        await map.setStyle(basemapSelector.value as StandardStyleID);
        showAll();
    });

    initTogglePanel();
})();
