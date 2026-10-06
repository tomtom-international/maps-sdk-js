import {
    getKnob,
    type KnobEntry,
    type KnobTarget,
    type StylingFoundationsKnobValue,
    setKnob,
} from '@tomtom-org/maps-sdk/map';
import { controlFor } from './knobControls';
import { groupOf, titleOf } from './knobLabels';

/**
 * A module lending the panel the knobs of how its layers look: its catalogue, which of them, and
 * the section they go in (by default, one section per id prefix).
 */
export type LookKnobSource = {
    module: KnobTarget<unknown> & { events: { on(event: 'config-change', handler: () => void): unknown } };
    catalogue: readonly KnobEntry<string>[];
    isLook?: (id: string) => boolean;
    section?: string;
};

// `setKnob` emits `config-change`, and the panel is rebuilt from that event — which would
// replace the very input the pointer is dragging. A change made from the panel is already shown in
// it, so only external ones (the reset button, a style switch, an agent) rebuild it.
let applyingFromPanel = false;
const applyKnob = ({ module, catalogue }: LookKnobSource, id: string, value: StylingFoundationsKnobValue) => {
    applyingFromPanel = true;
    try {
        setKnob(module, catalogue, id, value);
    } finally {
        applyingFromPanel = false;
    }
};

// Which groups the reader has collapsed. Kept outside the panel so a rebuild — a reset, a style
// switch, an agent — leaves the sections as they left them.
const collapsedGroups = new Set<string>();

// One collapsible section per knob group, chevron and all, built from the panel header's own
// classes so it looks and behaves like the panel's own toggle.
export const sectionFor = (group: string): { element: HTMLElement; controls: HTMLElement } => {
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

// Rebuilds the panel from the catalogues, each control showing the value the loaded style has now.
const renderPanel = (sources: readonly LookKnobSource[]) => {
    const container = document.querySelector('#ui-knobs') as HTMLElement;
    container.innerHTML = '';
    const sections = new Map<string, HTMLElement>();
    for (const source of sources) {
        for (const knob of source.catalogue.filter(({ id }) => source.isLook?.(id) ?? true)) {
            const group = source.section ?? groupOf(knob);
            let controls = sections.get(group);
            if (!controls) {
                const section = sectionFor(group);
                controls = section.controls;
                sections.set(group, controls);
                container.appendChild(section.element);
            }
            controls.appendChild(
                controlFor(
                    knob,
                    getKnob(source.module, source.catalogue, knob.id) as StylingFoundationsKnobValue,
                    (value) => applyKnob(source, knob.id, value),
                ),
            );
        }
    }
};

// What the panel hands back, so a style switch can rebuild it off the new style's values.
type StylingPanel = {
    render: () => void;
};

export const initStylingPanel = (sources: readonly LookKnobSource[]): StylingPanel => {
    const render = () => renderPanel(sources);
    render();
    // The panel follows the modules, wherever a change comes from (a reset, a preset, a style switch, an agent).
    for (const { module } of sources) {
        module.events.on('config-change', () => {
            if (!applyingFromPanel) render();
        });
    }

    return { render };
};
