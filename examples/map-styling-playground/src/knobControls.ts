import type { StylingKnobDescriptor, StylingKnobValue } from '@tomtom-org/maps-sdk/map';
import { labelOf } from './knobLabels';

// `<input type="color">` takes `#rrggbb` and nothing else, while the catalogue reports the style's
// own literals: `hsl()`, and `hsla()` for a label halo. One canvas parses every CSS colour form; a
// colour with alpha comes back as `rgba(…)`, whose alpha a picker has nowhere to put.
const probe = document.createElement('canvas').getContext('2d');
const channelToHex = (channel: string) => Number(channel).toString(16).padStart(2, '0');
const toHex = (cssColor: string): string | undefined => {
    if (!probe) return undefined;

    probe.fillStyle = cssColor;
    const painted = typeof probe.fillStyle === 'string' ? probe.fillStyle : '';
    const rgb = /^rgba?\((\d+), (\d+), (\d+)/.exec(painted);
    const hex = rgb ? `#${rgb.slice(1).map(channelToHex).join('')}` : painted;
    return /^#[0-9a-f]{6}$/.test(hex) ? hex : undefined;
};

// A drag fires `input` far faster than a restyle can run. Coalesce the events into one apply per
// animation frame with the last value winning, so the control keeps tracking the pointer, and
// flush on `change` so the value the user released on is always the one that lands.
const perFrameApplier = (apply: (value: string) => void) => {
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

// One control per knob, chosen from the knob's kind: a slider, a toggle or a colour picker. What
// the value is then set on is the caller's business — the panel owns the module.
export const controlFor = (knob: StylingKnobDescriptor, apply: (value: StylingKnobValue) => void): HTMLElement => {
    const field = document.createElement('label');
    field.className = knob.kind === 'toggle' ? 'ui-toggle-label' : 'ui-form-field';
    field.title = knob.description;

    if (knob.kind === 'toggle') {
        field.innerHTML = `<input type="checkbox" class="ui-toggle-input"><span class="ui-toggle-switch"></span>${labelOf(knob)}`;
        const input = field.querySelector('input') as HTMLInputElement;
        input.checked = knob.current === true;
        input.addEventListener('change', () => apply(input.checked));
    } else if (knob.kind === 'enum') {
        field.innerHTML = `<span class="ui-form-label">${labelOf(knob)}</span><select class="ui-dropdown"></select>`;
        const select = field.querySelector('select') as HTMLSelectElement;
        for (const option of knob.options ?? []) {
            select.add(new Option(option, option, false, option === knob.current));
        }
        select.addEventListener('change', () => apply(select.value));
    } else if (knob.kind === 'color') {
        field.innerHTML = `<span class="ui-form-label">${labelOf(knob)}</span><span class="ui-color-swatch"><input type="color"></span>`;
        const input = field.querySelector('input') as HTMLInputElement;
        const hex = typeof knob.current === 'string' ? toHex(knob.current) : undefined;
        if (hex) input.value = hex;

        // The native picker fires `input` continuously while the pointer moves over its gradient.
        const applier = perFrameApplier(apply);
        input.addEventListener('input', () => applier.queue(input.value));
        input.addEventListener('change', () => applier.flush());
    } else if (knob.range) {
        const { min, max, step } = knob.range;
        field.innerHTML = `<span class="ui-form-label">${labelOf(knob)}</span>
            <div class="ui-slider-container"><input type="range" class="ui-slider" min="${min}" max="${max}" step="${step}"><span class="ui-slider-value"></span></div>`;
        const input = field.querySelector('input') as HTMLInputElement;
        const value = field.querySelector('.ui-slider-value') as HTMLElement;
        input.value = String(knob.current ?? min);
        value.textContent = input.value;
        const applier = perFrameApplier((next) => apply(Number(next)));
        input.addEventListener('input', () => {
            // The readout follows the thumb on every event; the restyle waits for the frame.
            value.textContent = input.value;
            applier.queue(input.value);
        });
        input.addEventListener('change', () => applier.flush());
    }
    return field;
};
