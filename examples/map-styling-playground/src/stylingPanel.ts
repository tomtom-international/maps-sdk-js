import type { StylingKnobDescriptor, StylingKnobValue, StylingModule } from '@tomtom-org/maps-sdk/map';
import { controlFor } from './knobControls';
import { groupOf, titleOf } from './knobLabels';

// `styling.set` emits `config-change`, and the panel is rebuilt from that event — which would
// replace the very input the pointer is dragging. A change made from the panel is already shown in
// it, so only external ones (the reset button, a style switch, an agent) rebuild it.
let applyingFromPanel = false;
const applyKnob = (styling: StylingModule, id: StylingKnobDescriptor['id'], value: StylingKnobValue) => {
    applyingFromPanel = true;
    try {
        styling.set(id, value as never);
    } finally {
        applyingFromPanel = false;
    }
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
        controls.appendChild(controlFor(knob, (value) => applyKnob(styling, knob.id, value)));
    }
};

// What the panel hands back, so a style switch can rebuild it off the new style's catalogue.
type StylingPanel = {
    render: () => void;
};

export const initStylingPanel = (styling: StylingModule): StylingPanel => {
    renderPanel(styling);
    // The panel follows the module, wherever a change comes from (a reset, a style switch, an agent).
    styling.events.on('config-change', () => {
        if (!applyingFromPanel) renderPanel(styling);
    });

    return { render: () => renderPanel(styling) };
};
