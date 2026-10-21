import type {
    Landmarks3DKnob,
    Landmarks3DKnobId,
    Landmarks3DKnobValueOf,
} from '@tomtom-org/maps-sdk-plugin-landmarks-3d';

type KnobValue = Landmarks3DKnobValueOf<Landmarks3DKnobId>;

export type KnobControl = {
    element: HTMLElement;
    // Shows the value in force without rebuilding the control.
    show: (value: KnobValue | undefined) => void;
};

// A canvas turns any CSS colour, such as the style's `hsl(…)`, into the `#rrggbb` a colour input takes.
// It writes a translucent one as `rgba(…)`, which the input would reject for black: drop the alpha.
const canvasContext = document.createElement('canvas').getContext('2d') as CanvasRenderingContext2D;
export const toHex = (cssColor: string): string => {
    canvasContext.fillStyle = cssColor;
    const normalized = canvasContext.fillStyle;
    const channels = normalized.match(/^rgba?\((\d+), (\d+), (\d+)/);
    if (!channels) return normalized;
    return `#${channels
        .slice(1)
        .map((channel) => Number(channel).toString(16).padStart(2, '0'))
        .join('')}`;
};

// A drag fires `input` far faster than the map needs to redraw: one apply per animation frame,
// the last value winning, and a flush on `change` so the value released on is the one that lands.
export const perFrame = (apply: (value: string) => void) => {
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

// One control per catalogue entry, picked by its kind: a switch, a dropdown of its options, a colour
// picker or a slider over its range. Its tooltip is the knob's description.
export const knobControl = (knob: Landmarks3DKnob, label: string, apply: (value: KnobValue) => void): KnobControl => {
    if (knob.kind === 'toggle') {
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
    }

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
                if (typeof value === 'string') input.value = toHex(value);
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
