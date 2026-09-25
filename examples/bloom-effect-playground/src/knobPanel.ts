import type { MapEffects, MapEffectsKnobDescriptor } from '@tomtom-org/maps-sdk-plugin-map-effects';

// A dropdown for a list of colours, a slider for a range: whatever the catalogue says the knob is.
const renderKnob = (knob: MapEffectsKnobDescriptor, effects: MapEffects): HTMLElement | undefined => {
    const field = document.createElement('label');
    field.className = 'ui-form-field';
    field.title = knob.description;
    const name = knob.id.slice('bloom.'.length);

    if (knob.kind === 'colors' && knob.options) {
        // One named source at a time; '' stands for the empty list, the whole frame.
        const current = Array.isArray(knob.current) ? (knob.current[0] ?? '') : '';
        const options = ['', ...knob.options].map(
            (option) =>
                `<option value="${option}"${option === current ? ' selected' : ''}>${option || 'everything'}</option>`,
        );
        field.innerHTML = `<span class="ui-form-label">${name}</span><select class="ui-dropdown">${options.join('')}</select>`;
        const select = field.querySelector('select') as HTMLSelectElement;
        select.addEventListener('change', () => effects.set({ [knob.id]: select.value ? [select.value] : [] }));
        return field;
    }

    if (!knob.range) return undefined;

    const { min, max, step } = knob.range;
    field.innerHTML = `<span class="ui-form-label">${name}</span>
        <div class="ui-slider-container"><input type="range" class="ui-slider" min="${min}" max="${max}" step="${step}" value="${knob.current}"><span class="ui-slider-value">${knob.current}</span></div>`;
    const input = field.querySelector('input') as HTMLInputElement;
    const value = field.querySelector('.ui-slider-value') as HTMLElement;
    input.addEventListener('input', () => {
        value.textContent = input.value;
        effects.set({ [knob.id]: Number(input.value) });
    });
    return field;
};

/** Rebuilds the panel from `describe()`, so it shows the values in force right now. */
export const renderKnobPanel = (effects: MapEffects): void => {
    const container = document.querySelector('#ui-knobs') as HTMLElement;
    container.replaceChildren();
    for (const knob of effects.describe().knobs) {
        if (!knob.id.startsWith('bloom.')) continue;

        const field = renderKnob(knob, effects);
        if (field) container.appendChild(field);
    }
};
