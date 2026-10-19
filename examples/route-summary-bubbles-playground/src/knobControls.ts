import type { KnobEntry } from '@tomtom-org/maps-sdk/map';

export type KnobValue = boolean | number | string | string[];

// A knob with no value and no default is unset, and the module decides: the description says what.
// A control can set such a knob, not unset it again.
const UNSET = 'unset';

// A list knob is one checkbox per option, applied in the catalogue's order.
const listControl = (
    knob: KnobEntry<string, 'enums'>,
    current: unknown,
    apply: (value: string[]) => void,
): HTMLElement => {
    const field = document.createElement('fieldset');
    field.className = 'ui-form-field';
    field.title = knob.description;
    field.innerHTML = `<legend class="ui-form-label">${knob.id}</legend><div class="ui-checkbox-list"></div>`;
    const list = field.querySelector('.ui-checkbox-list') as HTMLElement;
    const chosen = new Set<unknown>(Array.isArray(current) ? current : knob.default);

    for (const option of knob.options) {
        const row = document.createElement('label');
        row.className = 'ui-checkbox-label';
        row.innerHTML = `<input type="checkbox">${option}`;
        const input = row.querySelector('input') as HTMLInputElement;
        input.checked = chosen.has(option);
        input.addEventListener('change', () => {
            if (input.checked) chosen.add(option);
            else chosen.delete(option);

            apply(knob.options.filter((value) => chosen.has(value)));
        });
        list.append(row);
    }
    return field;
};

// One control per knob, chosen from its kind, showing the value in force. A kind with no control
// here returns nothing, so the panel leaves that knob out.
export const controlFor = (
    knob: KnobEntry<string>,
    current: unknown,
    apply: (value: KnobValue) => void,
): HTMLElement | undefined => {
    if (knob.kind === 'enums') return listControl(knob, current, apply);

    const field = document.createElement('label');
    field.className = knob.kind === 'toggle' ? 'ui-toggle-label' : 'ui-form-field';
    field.title = knob.description;

    if (knob.kind === 'toggle') {
        field.innerHTML = `<input type="checkbox" class="ui-toggle-input"><span class="ui-toggle-switch"></span>${knob.id}`;
        const input = field.querySelector('input') as HTMLInputElement;
        input.checked = (current ?? knob.default) === true;
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
        const shown = typeof current === 'number' ? current : knob.default;
        field.innerHTML = `<span class="ui-form-label">${knob.id}</span>
            <div class="ui-slider-container"><input type="range" class="ui-slider" min="${min}" max="${max}" step="${step ?? 'any'}"><span class="ui-slider-value"></span></div>`;
        const input = field.querySelector('input') as HTMLInputElement;
        const readout = field.querySelector('.ui-slider-value') as HTMLElement;
        input.value = String(shown ?? min);
        readout.textContent = shown === undefined ? UNSET : input.value;
        input.addEventListener('input', () => {
            readout.textContent = input.value;
            apply(Number(input.value));
        });
    } else {
        return undefined;
    }
    return field;
};
