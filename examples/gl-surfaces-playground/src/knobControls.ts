import type { KnobEntry, KnobKind, KnobValueOf } from '@tomtom-org/maps-sdk/map';

// The value of any knob the panel offers, from the four plugins' and modules' catalogues it mixes.
type KnobValue = KnobValueOf<KnobKind>;

export type KnobControl = {
    element: HTMLElement;
    // Shows the value in force without rebuilding the control.
    show: (value: KnobValue | undefined) => void;
};

// A canvas turns any CSS colour, such as the style's `hsl(…)`, into the `#rrggbb` a colour input takes.
// It writes a translucent one as `rgba(…)`, which the input would reject for black: drop the alpha.
const canvasContext = document.createElement('canvas').getContext('2d') as CanvasRenderingContext2D;
const toHex = (cssColor: string): string => {
    canvasContext.fillStyle = cssColor;
    const normalized = canvasContext.fillStyle;
    const channels = normalized.match(/^rgba?\((\d+), (\d+), (\d+)/);
    if (!channels) return normalized;
    return `#${channels
        .slice(1)
        .map((channel) => Number(channel).toString(16).padStart(2, '0'))
        .join('')}`;
};

// A drag fires `input` far faster than the map draws: one apply per animation frame, the last value
// winning, and a flush on `change` so the value released on is the one that lands.
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

const toggleControl = (knob: KnobEntry<string>, label: string, apply: (value: KnobValue) => void): KnobControl => {
    const toggle = document.createElement('label');
    toggle.className = 'ui-toggle-label';
    toggle.title = knob.description;
    toggle.innerHTML = `<input type="checkbox" class="ui-toggle-input"><span class="ui-toggle-switch"></span>${label}`;
    const input = toggle.querySelector('input') as HTMLInputElement;
    input.addEventListener('change', () => apply(input.checked));
    return {
        element: toggle,
        show: (value) => {
            input.checked = value === true;
        },
    };
};

const colorControl = (field: HTMLElement, label: string, apply: (value: KnobValue) => void): KnobControl => {
    field.innerHTML = `<span class="ui-form-label">${label}</span><span class="ui-color-swatch"><input type="color"></span>`;
    const input = field.querySelector('input') as HTMLInputElement;
    const applier = perFrame((value) => apply(value));
    input.addEventListener('input', () => applier.queue(input.value));
    input.addEventListener('change', () => applier.flush());
    return {
        element: field,
        show: (value) => {
            if (typeof value === 'string') input.value = toHex(value);
        },
    };
};

// One option of a dropdown: what it reads and the value it stands for.
type Choice = { label: string; value: string };

// A dropdown of the options, each named as given; `choose` turns the one picked into the knob's value,
// and `chosen` the knob's value into the option to show.
const selectControl = (
    field: HTMLElement,
    label: string,
    options: readonly Choice[],
    choose: (picked: string) => KnobValue,
    chosen: (value: KnobValue) => string | undefined,
    apply: (value: KnobValue) => void,
): KnobControl => {
    field.innerHTML = `<span class="ui-form-label">${label}</span><select class="ui-dropdown"></select>`;
    const select = field.querySelector('select') as HTMLSelectElement;
    for (const option of options) select.add(new Option(option.label, option.value));
    select.addEventListener('change', () => apply(choose(select.value)));
    return {
        element: field,
        show: (value) => {
            const picked = value === undefined ? undefined : chosen(value);
            if (picked !== undefined) select.value = picked;
        },
    };
};

const sliderControl = (
    knob: KnobEntry<string>,
    field: HTMLElement,
    label: string,
    apply: (value: KnobValue) => void,
): KnobControl => {
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

// One control per catalogue entry, picked by its kind: a switch, a colour picker, a dropdown of its
// options, of one of its colours, or a slider over its range. Its tooltip is the knob's description.
export const knobControl = (knob: KnobEntry<string>, label: string, apply: (value: KnobValue) => void): KnobControl => {
    if (knob.kind === 'toggle') return toggleControl(knob, label, apply);

    const field = document.createElement('label');
    field.className = 'ui-form-field';
    field.title = knob.description;
    if (knob.kind === 'color') return colorControl(field, label, apply);
    if (knob.kind === 'enum') {
        const options = (knob.options ?? []).map((option) => ({ label: option, value: option }));
        return selectControl(
            field,
            label,
            options,
            (picked) => picked,
            (value) => (typeof value === 'string' ? value : undefined),
            apply,
        );
    }
    if (knob.kind === 'colors') {
        // One named colour at a time; '' stands for the empty list, the whole frame.
        const options = [
            { label: 'everything', value: '' },
            ...(knob.options ?? []).map((option) => ({ label: option, value: option })),
        ];
        const chosen = (value: KnobValue) => (Array.isArray(value) ? (value[0] ?? '') : undefined);
        return selectControl(field, label, options, (picked) => (picked ? [picked] : []), chosen, apply);
    }
    return sliderControl(knob, field, label, apply);
};
