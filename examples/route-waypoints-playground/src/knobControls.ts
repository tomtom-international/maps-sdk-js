import type { KnobEntry } from '@tomtom-org/maps-sdk/map';

export type KnobValue = boolean | number | string;

// A knob with no value and no default is unset, and the module decides: the description says what.
// A control can set such a knob, not unset it again.
const UNSET = 'unset';

// One control per knob, chosen from its kind, showing the value in force. A kind with no control
// here returns nothing, so the panel leaves that knob out.
export const controlFor = (
    knob: KnobEntry<string>,
    current: unknown,
    apply: (value: KnobValue) => void,
): HTMLElement | undefined => {
    const field = document.createElement('label');
    field.className = knob.kind === 'toggle' ? 'ui-toggle-label' : 'ui-form-field';
    field.title = knob.description;

    if (knob.kind === 'toggle') {
        field.innerHTML = `<input type="checkbox" class="ui-toggle-input"><span class="ui-toggle-switch"></span>${knob.id}`;
        const input = field.querySelector('input') as HTMLInputElement;
        input.checked = current === true;
        input.indeterminate = current === undefined;
        input.addEventListener('change', () => apply(input.checked));
    } else if (knob.kind === 'enum') {
        field.innerHTML = `<span class="ui-form-label">${knob.id}</span><select class="ui-dropdown"></select>`;
        const select = field.querySelector('select') as HTMLSelectElement;
        if (knob.default === undefined) {
            const unset = new Option(UNSET, '');
            unset.disabled = true;
            select.add(unset);
        }

        for (const option of knob.options) select.add(new Option(option, option));
        select.value = typeof current === 'string' ? current : '';
        select.addEventListener('change', () => apply(select.value));
    } else if (knob.kind === 'color') {
        field.innerHTML = `<span class="ui-form-label">${knob.id} <span class="ui-form-hint"></span></span>
            <span class="ui-color-swatch"><input type="color"></span>`;
        const input = field.querySelector('input') as HTMLInputElement;
        const hint = field.querySelector('.ui-form-hint') as HTMLElement;
        if (typeof current === 'string') input.value = current;
        else hint.textContent = UNSET;

        input.addEventListener('input', () => {
            hint.textContent = '';
            apply(input.value);
        });
    } else if (knob.kind === 'factor' || knob.kind === 'number') {
        const { min, max, step } = knob.range;
        field.innerHTML = `<span class="ui-form-label">${knob.id}</span>
            <div class="ui-slider-container"><input type="range" class="ui-slider" min="${min}" max="${max}" step="${step ?? 'any'}"><span class="ui-slider-value"></span></div>`;
        const input = field.querySelector('input') as HTMLInputElement;
        const readout = field.querySelector('.ui-slider-value') as HTMLElement;
        input.value = String(typeof current === 'number' ? current : min);
        readout.textContent = typeof current === 'number' ? input.value : UNSET;
        input.addEventListener('input', () => {
            readout.textContent = input.value;
            apply(Number(input.value));
        });
    } else {
        return undefined;
    }
    return field;
};
