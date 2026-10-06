import type { TerrainKnob, TerrainKnobValueOf } from '@tomtom-org/maps-sdk/map';

type KnobValue = TerrainKnobValueOf<TerrainKnob['id']>;

export type KnobControl = {
    element: HTMLElement;
    // Shows the value in force without rebuilding the control.
    show: (value: KnobValue | undefined) => void;
};

const HEX_COLOR = /^#[0-9a-f]{6}$/i;

// A drag fires `input` far faster than a restyle can run: one apply per animation frame, the last
// value winning, and a flush on `change` so the value released on is the one that lands.
const perFrame = (apply: (value: string) => void) => {
    let pending: string | undefined;
    let frame = 0;
    const run = () => {
        frame = 0;
        if (pending === undefined) return;

        const value = pending;
        pending = undefined;
        apply(value);
    };
    return {
        queue: (value: string) => {
            pending = value;
            if (!frame) frame = requestAnimationFrame(run);
        },
        flush: () => {
            if (frame) cancelAnimationFrame(frame);

            run();
        },
    };
};

// One control per catalogue entry, picked by its kind: a dropdown of its options, a slider over its
// range, or a colour picker. Its tooltip is the knob's description.
export const knobControl = (knob: TerrainKnob, label: string, apply: (value: KnobValue) => void): KnobControl => {
    const field = document.createElement('label');
    field.className = 'ui-form-field';
    field.title = knob.description;

    if (knob.kind === 'enum') {
        field.innerHTML = `<span class="ui-form-label">${label}</span><select class="ui-dropdown"></select>`;
        const select = field.querySelector('select') as HTMLSelectElement;
        for (const option of knob.options ?? []) select.add(new Option(option));
        select.addEventListener('change', () => apply(select.value as KnobValue));
        return {
            element: field,
            show: (value) => {
                select.value = String(value ?? '');
            },
        };
    }

    if (knob.kind === 'color') {
        field.innerHTML = `<span class="ui-form-label">${label}</span><span class="ui-color-swatch"><input type="color"></span>`;
        const input = field.querySelector('input') as HTMLInputElement;
        const applier = perFrame((value) => apply(value));
        input.addEventListener('input', () => applier.queue(input.value));
        input.addEventListener('change', () => applier.flush());
        return {
            element: field,
            show: (value) => {
                if (typeof value === 'string' && HEX_COLOR.test(value)) input.value = value.toLowerCase();
            },
        };
    }

    const { min = 0, max = 1, step = 'any' } = knob.range ?? {};
    field.innerHTML = `<span class="ui-form-label">${label}</span>
        <div class="ui-slider-container"><input type="range" class="ui-slider" min="${min}" max="${max}" step="${step}"><span class="ui-slider-value"></span></div>`;
    const input = field.querySelector('input') as HTMLInputElement;
    const readout = field.querySelector('.ui-slider-value') as HTMLElement;
    const applier = perFrame((value) => apply(Number(value)));
    input.addEventListener('input', () => {
        readout.textContent = input.value;
        applier.queue(input.value);
    });
    input.addEventListener('change', () => applier.flush());
    return {
        element: field,
        show: (value) => {
            if (typeof value !== 'number') return;

            input.value = String(value);
            readout.textContent = input.value;
        },
    };
};
