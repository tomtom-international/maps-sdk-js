import { TomTomConfig } from '@tomtom-org/maps-sdk/core';
import {
    getKnob,
    knobEntryOf,
    type StandardStyleID,
    setKnob,
    standardStyleIDs,
    type TerrainHillshadeConfig,
    type TerrainKnobId,
    TerrainModule,
    TomTomMap,
    terrainKnobCatalogue,
} from '@tomtom-org/maps-sdk/map';
import './style.css';
import { API_KEY } from './config';
import { type KnobControl, knobControl } from './knobControls';
import { looks } from './looks';
import { initTogglePanel } from './togglePanel';

// (Set your own API key when working in your own environment)
TomTomConfig.instance.put({ apiKey: API_KEY, language: 'en-GB' });

// Every look keeps the shading on and drawn at every zoom: the standard styles stop it at 13.
const ALWAYS: TerrainHillshadeConfig = { visible: true, maxZoom: 22 };

// The panel's sections, each a list of terrain knobs with the label its control takes.
const sections: Record<string, [TerrainKnobId, string][]> = {
    '#ui-shading': [
        ['hillshade.method', 'Method'],
        ['hillshade.exaggeration', 'Strength'],
        ['hillshade.maxZoom', 'Drawn up to zoom'],
    ],
    '#ui-light': [
        ['hillshade.lightDirection', 'Light direction (°)'],
        ['hillshade.lightAltitude', 'Light altitude (°)'],
        ['hillshade.lightAlignment', 'Light measured from'],
    ],
    '#ui-colors': [
        ['hillshade.shadowColor', 'Shadow'],
        ['hillshade.highlightColor', 'Highlight'],
        ['hillshade.accentColor', 'Accent'],
    ],
};

// The day the sun toggle plays: rising in the east, highest at noon in the south, setting in the west.
const DAY_MS = 12000;
const sunAt = (progress: number) => ({
    direction: Math.round(90 + 180 * progress),
    altitude: Math.round(4 + 56 * Math.sin(Math.PI * progress)),
});

(async () => {
    const [initialLook] = looks;
    // The Bernese Alps: the Eiger, Mönch and Jungfrau above the deep Lauterbrunnen valley.
    const map = new TomTomMap({ mapLibre: { container: 'sdk-map', center: [7.94, 46.58], zoom: 10.4 } });
    const terrain = await TerrainModule.get(map, { hillshade: { ...ALWAYS, ...initialLook.hillshade } });

    // getKnob reports a setting left unset as the loaded style draws it, so the controls always
    // show the value in force. The ids come as an array: the live editor's ES5 transpile runs a
    // `for…of` over the Map's own iterator zero times.
    const controls = new Map<TerrainKnobId, KnobControl>();
    const showValues = (ids: TerrainKnobId[] = Array.from(controls.keys())) => {
        for (const id of ids) controls.get(id)?.show(getKnob(terrain, terrainKnobCatalogue, id));
    };
    for (const [selector, knobs] of Object.entries(sections)) {
        const container = document.querySelector(selector) as HTMLElement;
        for (const [id, label] of knobs) {
            const control = knobControl(knobEntryOf(terrainKnobCatalogue, id), label, (value) =>
                setKnob(terrain, terrainKnobCatalogue, id, value as never),
            );
            controls.set(id, control);
            container.append(control.element);
        }
    }
    showValues();

    const lookSelector = document.querySelector('#ui-look') as HTMLSelectElement;
    looks.forEach((look, index) => lookSelector.add(new Option(look.label, String(index))));
    const applyLook = () => {
        terrain.applyConfig({ hillshade: { ...ALWAYS, ...looks[Number(lookSelector.value)].hillshade } });
        showValues();
    };
    lookSelector.addEventListener('change', applyLook);
    document.querySelector('#ui-reset')?.addEventListener('click', applyLook);

    // The hillshade settings are module configuration, so they outlive the switch.
    const styleSelector = document.querySelector('#ui-mapStyle') as HTMLSelectElement;
    standardStyleIDs.forEach((styleId) => styleSelector.add(new Option(styleId)));
    styleSelector.addEventListener('change', () => map.setStyle(styleSelector.value as StandardStyleID));

    // With the light measured from the viewport it turns with the map; from the map, it stays put.
    document.querySelector('#ui-rotate')?.addEventListener('click', () => {
        map.mapLibreMap.easeTo({ bearing: map.mapLibreMap.getBearing() + 90, duration: 2000 });
    });

    const sun = document.querySelector('#ui-sun') as HTMLInputElement;
    let frame = 0;
    const playDay = (startedAt: number) => (now: number) => {
        const { direction, altitude } = sunAt(((now - startedAt) % DAY_MS) / DAY_MS);
        setKnob(terrain, terrainKnobCatalogue, 'hillshade.lightDirection', direction);
        setKnob(terrain, terrainKnobCatalogue, 'hillshade.lightAltitude', altitude);
        showValues(['hillshade.lightDirection', 'hillshade.lightAltitude']);
        frame = requestAnimationFrame(playDay(startedAt));
    };
    sun.addEventListener('change', () => {
        cancelAnimationFrame(frame);
        if (!sun.checked) return;

        // The standard and igor methods ignore the altitude, so the sun would only circle.
        const method = getKnob(terrain, terrainKnobCatalogue, 'hillshade.method');
        if (method === 'standard' || method === 'igor') {
            setKnob(terrain, terrainKnobCatalogue, 'hillshade.method', 'multidirectional');
            showValues(['hillshade.method']);
        }
        frame = requestAnimationFrame(playDay(performance.now()));
    });

    initTogglePanel();
})();
