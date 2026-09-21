import { TomTomConfig } from '@tomtom-org/maps-sdk/core';
import {
    StandardStyleID,
    StylingKnobDescriptor,
    StylingModule,
    standardStyleIDs,
    TomTomMap,
    TrafficFlowModule,
} from '@tomtom-org/maps-sdk/map';
import './style.css';
import { API_KEY } from './config';
import { initTogglePanel } from './togglePanel';

// (Set your own API key when working in your own environment)
TomTomConfig.instance.put({ apiKey: API_KEY, language: 'en-GB' });

// A CSS colour as the `<input type="color">` wants it: the catalogue reports hsl() literals.
const toHex = (cssColor: string): string => {
    const probe = document.createElement('canvas').getContext('2d');
    if (!probe) return '#000000';
    probe.fillStyle = cssColor;
    return probe.fillStyle;
};

// 'roads.exitNumbers' -> 'Exit numbers': the part after the last dot names the control.
const labelOf = (knob: StylingKnobDescriptor): string => {
    const name = knob.id.slice(knob.id.lastIndexOf('.') + 1).replace(/([A-Z])/g, ' $1');
    return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
};

// Everything before the last dot names the group, so `traffic.flow.*` and `traffic.incidents.*`
// become two groups rather than one. They have to: both carry a `widthFactor` and a `closedColor`,
// so in a single "traffic" section two controls would read "Width factor" with nothing to tell them
// apart.
const groupOf = (knob: StylingKnobDescriptor): string => knob.id.slice(0, knob.id.lastIndexOf('.'));

// 'traffic.flow' -> 'Traffic flow'.
const titleOf = (group: string): string => {
    const words = group.split('.').join(' ');
    return words === 'pois' ? 'POIs' : words.charAt(0).toUpperCase() + words.slice(1);
};

// `styling.set` emits `config-change`, and the panel is rebuilt from that event — which would
// replace the very input the pointer is dragging. A change made from the panel is already shown in
// it, so only external ones (the reset button, a style switch, an agent) rebuild it.
let applyingFromPanel = false;
const applyKnob = (styling: StylingModule, id: StylingKnobDescriptor['id'], value: unknown) => {
    applyingFromPanel = true;
    try {
        styling.set(id, value as never);
    } finally {
        applyingFromPanel = false;
    }
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

// One control per knob, chosen from the knob's kind: a slider, a toggle or a colour picker.
const controlFor = (knob: StylingKnobDescriptor, styling: StylingModule): HTMLElement => {
    const field = document.createElement('label');
    field.className = knob.kind === 'toggle' ? 'ui-toggle-label' : 'ui-form-field';
    field.title = knob.description;

    if (knob.kind === 'toggle') {
        field.innerHTML = `<input type="checkbox" class="ui-toggle-input"><span class="ui-toggle-switch"></span>${labelOf(knob)}`;
        const input = field.querySelector('input') as HTMLInputElement;
        input.checked = knob.current === true;
        input.addEventListener('change', () => applyKnob(styling, knob.id, input.checked));
    } else if (knob.kind === 'color') {
        field.innerHTML = `<span class="ui-form-label">${labelOf(knob)}</span><span class="ui-color-swatch"><input type="color"></span>`;
        const input = field.querySelector('input') as HTMLInputElement;
        // The catalogue reports the style's own colours as `hsl()` literals, which the colour input
        // does not take: let the canvas convert them to the hex it wants.
        if (typeof knob.current === 'string') input.value = toHex(knob.current);
        // The native picker fires `input` continuously while the pointer moves over its gradient.
        const applier = perFrameApplier((value) => applyKnob(styling, knob.id, value));
        input.addEventListener('input', () => applier.queue(input.value));
        input.addEventListener('change', () => applier.flush());
    } else {
        const { min, max, step } = knob.range as { min: number; max: number; step: number };
        field.innerHTML = `<span class="ui-form-label">${labelOf(knob)}</span>
            <div class="ui-slider-container"><input type="range" class="ui-slider" min="${min}" max="${max}" step="${step}"><span class="ui-slider-value"></span></div>`;
        const input = field.querySelector('input') as HTMLInputElement;
        const value = field.querySelector('.ui-slider-value') as HTMLElement;
        input.value = String(knob.current ?? min);
        value.textContent = input.value;
        const applier = perFrameApplier((next) => applyKnob(styling, knob.id, Number(next)));
        input.addEventListener('input', () => {
            // The readout follows the thumb on every event; the restyle waits for the frame.
            value.textContent = input.value;
            applier.queue(input.value);
        });
        input.addEventListener('change', () => applier.flush());
    }
    return field;
};

// Which groups the reader has collapsed. Kept outside the panel so a rebuild — a reset, a style
// switch, an agent — leaves the sections as they left them.
const collapsedGroups = new Set<string>();

// One collapsible section per knob group, chevron and all, built from the panel header's own
// classes so it looks and behaves like the panel's own toggle.
const sectionFor = (group: string): { element: HTMLElement; controls: HTMLElement } => {
    const element = document.createElement('div');
    element.className = 'ui-section';
    const collapsed = collapsedGroups.has(group);
    element.innerHTML = `
        <h4 class="ui-subheading ui-sectionHeading">
            <button class="ui-heading-toggle ui-sectionToggle" type="button" aria-expanded="${!collapsed}">
                <span>${titleOf(group)}</span>
                <svg class="ui-heading-chevron" viewBox="0 0 16 10"><path d="M3 1.5L8 6.5L13 1.5" /></svg>
            </button>
        </h4>
        <div class="ui-section-content${collapsed ? ' collapsed' : ''}"></div>`;

    const toggle = element.querySelector('button') as HTMLButtonElement;
    const controls = element.querySelector('.ui-section-content') as HTMLElement;
    toggle.addEventListener('click', () => {
        const collapsing = toggle.getAttribute('aria-expanded') === 'true';
        toggle.setAttribute('aria-expanded', collapsing ? 'false' : 'true');
        controls.classList.toggle('collapsed', collapsing);
        if (collapsing) collapsedGroups.add(group);
        else collapsedGroups.delete(group);
    });
    return { element, controls };
};

// Rebuilds the panel from the catalogue, so it always shows what the loaded style can do.
const renderPanel = (styling: StylingModule) => {
    const container = document.querySelector('#ui-knobs') as HTMLElement;
    container.innerHTML = '';
    const sections = new Map<string, HTMLElement>();
    for (const knob of styling.describe().knobs) {
        const group = groupOf(knob);
        let controls = sections.get(group);
        if (!controls) {
            const section = sectionFor(group);
            controls = section.controls;
            sections.set(group, controls);
            container.appendChild(section.element);
        }
        controls.appendChild(controlFor(knob, styling));
    }
};

(async () => {
    const map = new TomTomMap({
        mapLibre: { container: 'sdk-map', center: [4.8952, 52.3702], zoom: 13 },
    });
    // Traffic flow on, so the congestion colour knobs have something to colour.
    await TrafficFlowModule.get(map, { visible: true });

    const styling = await StylingModule.get(map, { 'labels.sizeFactor': 1.2 });
    renderPanel(styling);
    // The panel follows the module, wherever a change comes from (a reset, a style switch, an agent).
    styling.events.on('config-change', () => {
        if (!applyingFromPanel) renderPanel(styling);
    });

    document.querySelector('#ui-reset')?.addEventListener('click', () => styling.reset());

    const stylesSelector = document.querySelector('#ui-mapStyles') as HTMLSelectElement;
    for (const id of standardStyleIDs) {
        stylesSelector.add(new Option(id));
    }
    stylesSelector.addEventListener('change', async (event) => {
        // Knob settings survive the switch: the module re-applies them on the new style.
        await map.setStyle((event.target as HTMLOptionElement).value as StandardStyleID);
        renderPanel(styling);
    });

    initTogglePanel();
})();
