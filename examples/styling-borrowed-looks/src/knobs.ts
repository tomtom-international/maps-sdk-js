import {
    getKnob,
    type KnobEntry,
    type KnobTarget,
    knobEntryOf,
    type POIsModule,
    poisKnobCatalogue,
    resetKnob,
    type StylingFoundationsModule,
    setKnob,
    stylingFoundationsKnobCatalogue,
    type TrafficIncidentsModule,
    trafficIncidentsKnobCatalogue,
} from '@tomtom-org/maps-sdk/map';
import { formatHex, modeHsl, modeRgb, parse, useMode } from 'culori/fn';

type KnobValue = string | number;

/** The modules whose knobs restyle what the modules on this map borrow from the style. */
export type LookModules = { styling: StylingFoundationsModule; pois: POIsModule; incidents: TrafficIncidentsModule };

type PanelKnob = { module: KnobTarget<unknown>; catalogue: readonly KnobEntry<string>[]; id: string; label: string };

// The knobs that restyle what the modules on this map borrow from the style, by panel section.
// Each lives on the module drawing those layers: POI labels on `POIsModule`, label size on
// `StylingFoundationsModule`, delay colours on `TrafficIncidentsModule`.
const panelKnobs = ({ styling, pois, incidents }: LookModules): Record<string, PanelKnob[]> => ({
    '#ui-poi-knobs': [
        { module: pois, catalogue: poisKnobCatalogue, id: 'label.color', label: 'Label colour' },
        { module: pois, catalogue: poisKnobCatalogue, id: 'label.haloColor', label: 'Label halo' },
        { module: styling, catalogue: stylingFoundationsKnobCatalogue, id: 'labels.sizeFactor', label: 'Label size' },
        { module: pois, catalogue: poisKnobCatalogue, id: 'sizeFactor', label: 'POI size' },
    ],
    '#ui-incident-knobs': [
        { module: incidents, catalogue: trafficIncidentsKnobCatalogue, id: 'colors.minor', label: 'Minor delay' },
        { module: incidents, catalogue: trafficIncidentsKnobCatalogue, id: 'colors.moderate', label: 'Moderate delay' },
        { module: incidents, catalogue: trafficIncidentsKnobCatalogue, id: 'colors.major', label: 'Major delay' },
        { module: incidents, catalogue: trafficIncidentsKnobCatalogue, id: 'colors.closed', label: 'Closed road' },
    ],
});

// `<input type="color">` takes `#rrggbb` and nothing else, while the knobs report the style's own
// literals: `hsl()`, and `hsla()` for a label halo. The picker has nowhere to put alpha, so it goes.
useMode(modeRgb);
useMode(modeHsl);
const toHex = (cssColor: string): string | undefined => {
    const color = parse(cssColor);
    return color && formatHex(color);
};

// A drag fires `input` far faster than a restyle can run. Coalesce the events into one apply per
// animation frame with the last value winning, and flush on `change` so the value the user
// released on is always the one that lands.
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

// A colour picker for a colour knob, a slider for a factor, each showing the value in force. The
// style colours POI labels per category, which no single colour stands for, so that picker starts
// grey and says so.
const controlFor = (
    knob: KnobEntry<string>,
    label: string,
    current: unknown,
    apply: (value: KnobValue) => void,
): HTMLElement => {
    const field = document.createElement('label');
    field.className = 'ui-form-field';
    field.title = knob.description;

    if (knob.kind === 'color') {
        const hex = typeof current === 'string' ? toHex(current) : undefined;
        field.className = 'ui-form-field-inline';
        field.innerHTML = `<span class="ui-color-swatch"><input type="color" value="${hex ?? '#808080'}"></span><span class="ui-form-label"></span>`;
        (field.querySelector('.ui-form-label') as HTMLElement).textContent = hex ? label : `${label} (per category)`;
        const input = field.querySelector('input') as HTMLInputElement;
        const applier = perFrameApplier(apply);
        input.addEventListener('input', () => applier.queue(input.value));
        input.addEventListener('change', () => applier.flush());
    } else if (knob.range) {
        const { min, max, step } = knob.range;
        field.innerHTML = `<span class="ui-form-label">${label}</span>
            <div class="ui-slider-container"><input type="range" class="ui-slider" min="${min}" max="${max}" step="${step}"><span class="ui-slider-value"></span></div>`;
        const input = field.querySelector('input') as HTMLInputElement;
        const readout = field.querySelector('.ui-slider-value') as HTMLElement;
        input.value = String(current ?? 1);
        readout.textContent = input.value;
        const applier = perFrameApplier((next) => apply(Number(next)));
        input.addEventListener('input', () => {
            readout.textContent = input.value;
            applier.queue(input.value);
        });
        input.addEventListener('change', () => applier.flush());
    }
    return field;
};

/** The knob panel and its reset button, rebuilt whenever something other than the panel changes a knob. */
export const initKnobPanel = (modules: LookModules): void => {
    const sections = panelKnobs(modules);
    // `setKnob` emits `config-change`; rebuilding on it would replace the input being dragged.
    let applyingFromPanel = false;
    const applyKnob = ({ module, catalogue, id }: PanelKnob, value: KnobValue) => {
        applyingFromPanel = true;
        try {
            setKnob(module, catalogue, id, value);
        } finally {
            applyingFromPanel = false;
        }
    };

    const renderPanel = () => {
        for (const [selector, knobs] of Object.entries(sections)) {
            const container = document.querySelector(selector) as HTMLElement;
            container.innerHTML = '';
            for (const knob of knobs) {
                const { module, catalogue, id, label } = knob;
                const current = getKnob(module, catalogue, id);
                container.appendChild(
                    controlFor(knobEntryOf(catalogue, id), label, current, (value) => applyKnob(knob, value)),
                );
            }
        }
    };

    renderPanel();
    const rerender = () => {
        if (!applyingFromPanel) renderPanel();
    };
    modules.styling.events.on('config-change', rerender);
    modules.pois.events.on('config-change', rerender);
    modules.incidents.events.on('config-change', rerender);
    document.querySelector('#ui-reset')?.addEventListener('click', () => {
        for (const { module, catalogue, id } of Object.values(sections).flat()) resetKnob(module, catalogue, id);
    });
};
