import { TomTomConfig } from '@tomtom-org/maps-sdk/core';
import { TomTomMap, TrafficFlowModule } from '@tomtom-org/maps-sdk/map';
import { MapEffects, type MapEffectsSettings } from '@tomtom-org/maps-sdk-plugin-map-effects';
import './style.css';
import { API_KEY } from './config';
import { initTogglePanel } from './togglePanel';

// (Set your own API key when working in your own environment)
TomTomConfig.instance.put({ apiKey: API_KEY, language: 'en-GB' });

// Each use case is a settings object.
const useCases: Record<string, MapEffectsSettings> = {
    'data-viz': { 'grade.saturation': 0.35, 'grade.brightness': 0.85, 'tint.color': '#1f2937', 'tint.opacity': 0.2 },
    'night-driving': { 'bloom.intensity': 0.6, 'bloom.radius': 14, 'bloom.threshold': 0.55 },
    focus: { 'vignette.intensity': -0.45, 'edgeBlur.intensity': 10, 'edgeBlur.reach': 0.45 },
};

const map = new TomTomMap({
    style: 'standardDark',
    mapLibre: {
        container: 'sdk-map',
        center: [4.8952, 52.3702],
        zoom: 13,
        // Tilted, because the depth of field is a function of the camera: seen from straight above
        // every part of the ground is the same distance away and that knob has nothing to do.
        pitch: 60,
        maxPitch: 85,
        // Bloom, the depth of field and capture all read the map canvas back; MapLibre keeps it
        // readable only when asked.
        canvasContextAttributes: { preserveDrawingBuffer: true },
    },
});
// Traffic tubes are what bloom lights up on a dark style.
TrafficFlowModule.get(map, { visible: true });

const effects = new MapEffects(map);

// One control per knob, grouped by effect, from the catalogue.
const renderPanel = () => {
    const container = document.querySelector('#ui-knobs') as HTMLElement;
    container.innerHTML = '';
    const sections = new Map<string, HTMLElement>();
    for (const knob of effects.describe().knobs) {
        const [group, name] = knob.id.split('.');
        let section = sections.get(group);
        if (!section) {
            section = document.createElement('div');
            section.className = 'ui-section';
            section.innerHTML = `<h4 class="ui-subheading" title="${knob.useCase}">${group}</h4>`;
            sections.set(group, section);
            container.appendChild(section);
        }
        const field = document.createElement('label');
        field.className = 'ui-form-field';
        field.title = knob.description;
        if (knob.kind === 'color') {
            field.innerHTML = `<span class="ui-form-label">${name}</span><span class="ui-color-swatch"><input type="color" value="${knob.current}"></span>`;
            const input = field.querySelector('input') as HTMLInputElement;
            input.addEventListener('input', () => effects.set({ [knob.id]: input.value }));
        } else if (knob.kind === 'colors' && knob.options) {
            // One named source at a time; '' stands for the empty list, the whole frame.
            const current = Array.isArray(knob.current) ? (knob.current[0] ?? '') : '';
            const options = ['', ...knob.options].map(
                (option) =>
                    `<option value="${option}"${option === current ? ' selected' : ''}>${option || 'everything'}</option>`,
            );
            field.innerHTML = `<span class="ui-form-label">${name}</span><select class="ui-dropdown">${options.join('')}</select>`;
            const select = field.querySelector('select') as HTMLSelectElement;
            select.addEventListener('change', () => effects.set({ [knob.id]: select.value ? [select.value] : [] }));
        } else if (knob.range) {
            const { min, max, step } = knob.range;
            field.innerHTML = `<span class="ui-form-label">${name}</span>
                <div class="ui-slider-container"><input type="range" class="ui-slider" min="${min}" max="${max}" step="${step}" value="${knob.current}"><span class="ui-slider-value">${knob.current}</span></div>`;
            const input = field.querySelector('input') as HTMLInputElement;
            const value = field.querySelector('.ui-slider-value') as HTMLElement;
            input.addEventListener('input', () => {
                value.textContent = input.value;
                effects.set({ [knob.id]: Number(input.value) });
            });
        }
        section.appendChild(field);
    }
};
renderPanel();

const useCaseSelector = document.querySelector('#ui-useCase') as HTMLSelectElement;
useCaseSelector.addEventListener('change', () => {
    effects.applyConfig(useCases[useCaseSelector.value] ?? {});
    renderPanel();
});

document.querySelector('#ui-reset')?.addEventListener('click', () => {
    effects.reset();
    useCaseSelector.value = '';
    renderPanel();
});

document.querySelector('#ui-capture')?.addEventListener('click', async () => {
    const canvas = await effects.capture({ pixelRatio: 2 });
    window.open()?.document.body.appendChild(canvas);
});

initTogglePanel();
