import { TomTomConfig } from '@tomtom-org/maps-sdk/core';
import {
    getKnob,
    knobEntryOf,
    type StandardStyleID,
    setKnob,
    standardStyleIDs,
    TomTomMap,
} from '@tomtom-org/maps-sdk/map';
import {
    Buildings3D,
    type Buildings3DKnobId,
    buildings3DKnobCatalogue,
    Landmarks3D,
} from '@tomtom-org/maps-sdk-plugin-landmarks-3d';
import './style.css';
import { API_KEY } from './config';
import { type KnobControl, knobControl } from './knobControls';
import { initTogglePanel } from './togglePanel';

// (Set your own API key when working in your own environment)
TomTomConfig.instance.put({ apiKey: API_KEY, language: 'en-GB' });

// The panel's sections, each a list of buildings knobs with the label its control takes.
const sections: Record<string, [Buildings3DKnobId, string][]> = {
    '#ui-look': [['preset', 'Preset']],
    '#ui-facade': [
        ['facade.pattern', 'Windows'],
        ['facade.intensity', 'Window strength'],
        ['facade.floorHeightMeters', 'Storey height (m)'],
        ['reflections.intensity', 'Glass reflections'],
        ['litWindows.fraction', 'Lit windows'],
    ],
    '#ui-colors': [
        ['walls.color', 'Walls'],
        ['roofs.color', 'Roofs'],
        ['windows.color', 'Glass'],
        ['litWindows.color', 'Lit'],
    ],
    '#ui-light': [
        ['light.direction', 'Light direction (°)'],
        ['light.altitude', 'Light altitude (°)'],
        ['light.intensity', 'Light strength'],
        ['shadows.visible', 'Shadows'],
        ['shadows.intensity', 'Shadow darkness'],
    ],
    '#ui-labels': [
        ['roadLabels.occluded', 'Road names behind buildings'],
        ['pois.occluded', 'POIs behind buildings'],
    ],
};

// The day the sun toggle plays: rising in the east, highest at noon in the south, setting in the west.
// Fractions of a degree, so the shadows sweep rather than step from one whole degree to the next.
const DAY_MS = 15000;
const sunAt = (progress: number) => ({
    direction: 90 + 180 * progress,
    altitude: 8 + 52 * Math.sin(Math.PI * progress),
});

(async () => {
    // Midtown Manhattan, looking north over its towers.
    const map = new TomTomMap({
        mapLibre: { container: 'sdk-map', center: [-73.9857, 40.7484], zoom: 16.3, pitch: 60, bearing: -20 },
    });

    // Extrudes the buildings of the tiles the map already loads. Every knob left unset follows the map style.
    const buildings = new Buildings3D(map);

    // getKnob reports the value each knob resolves to, the preset's when unset, so the controls always
    // show what the map draws.
    const controls = new Map<Buildings3DKnobId, KnobControl>();
    const showValues = (ids: Buildings3DKnobId[] = Array.from(controls.keys())) => {
        for (const id of ids) controls.get(id)?.show(getKnob(buildings, buildings3DKnobCatalogue, id));
    };
    for (const [selector, knobs] of Object.entries(sections)) {
        const container = document.querySelector(selector) as HTMLElement;
        for (const [id, label] of knobs) {
            const control = knobControl(knobEntryOf(buildings3DKnobCatalogue, id), label, (value) => {
                setKnob(buildings, buildings3DKnobCatalogue, id, value as never);
                // A preset changes every knob left unset, and the walls' colour the roofs' while unset.
                if (id === 'preset') showValues();
                if (id === 'walls.color') showValues(['roofs.color']);
            });
            controls.set(id, control);
            container.append(control.element);
        }
    }
    map.mapLibreMap.once('idle', () => showValues());

    // The buildings come back after a style switch, in the look of the new style while `auto`.
    const styleSelector = document.querySelector('#ui-mapStyle') as HTMLSelectElement;
    standardStyleIDs.forEach((styleId) => styleSelector.add(new Option(styleId)));
    styleSelector.addEventListener('change', async () => {
        await map.setStyle(styleSelector.value as StandardStyleID);
        showValues();
    });

    // The Empire State Building and its neighbours, from Orbis 3D Landmarks. They stand under the buildings'
    // sun and in their shadows, in their wall colour with their own stonework as facade detail.
    const landmarksToggle = document.querySelector('#ui-landmarks') as HTMLInputElement;
    let landmarks: Landmarks3D | undefined;
    landmarksToggle.addEventListener('change', () => {
        landmarks ??= new Landmarks3D(map);
        landmarks.setVisible(landmarksToggle.checked);
    });

    const sun = document.querySelector('#ui-sun') as HTMLInputElement;
    let frame = 0;
    const playDay = (startedAt: number) => (now: number) => {
        const { direction, altitude } = sunAt(((now - startedAt) % DAY_MS) / DAY_MS);
        buildings.updateConfig({ light: { ...buildings.getConfig().light, direction, altitude } });
        showValues(['light.direction', 'light.altitude']);
        frame = requestAnimationFrame(playDay(startedAt));
    };
    sun.addEventListener('change', () => {
        cancelAnimationFrame(frame);
        if (sun.checked) frame = requestAnimationFrame(playDay(performance.now()));
    });

    document.querySelector('#ui-reset')?.addEventListener('click', () => {
        sun.checked = false;
        cancelAnimationFrame(frame);
        buildings.resetConfig();
        showValues();
    });

    initTogglePanel();
})();
