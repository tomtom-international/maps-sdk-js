import {
    type BaseMapLayerGroupName,
    type BaseMapModule,
    baseMapKnobCatalogue,
    setKnob,
} from '@tomtom-org/maps-sdk/map';
import { controlFor, perFrameApplier } from './knobControls';
import { sectionFor } from './stylingPanel';

const groupKnobs = baseMapKnobCatalogue.filter(({ id }) => id.startsWith('groups.'));

// 'groups.water.visible' -> 'water'.
const groupOf = (id: string) => id.split('.')[1] as BaseMapLayerGroupName;

// Whole layer groups are BaseMapModule's, from its own catalogue, with the same controls as the styling
// knobs. A group's knob is unset until something sets it, so each toggle shows what the style draws now.
export const initBaseMapGroupsPanel = (baseMap: BaseMapModule) => {
    const container = document.querySelector('#ui-baseMapGroups') as HTMLElement;
    // A toggle pressed here already shows its change, and rebuilding would take the focus off it.
    let applyingFromPanel = false;
    const setGroupVisible = (id: (typeof groupKnobs)[number]['id'], visible: boolean) => {
        applyingFromPanel = true;
        try {
            setKnob(baseMap, baseMapKnobCatalogue, id, visible);
        } finally {
            applyingFromPanel = false;
        }
    };
    const render = () => {
        const { element, controls } = sectionFor('base map layer groups');
        for (const knob of groupKnobs) {
            const group = groupOf(knob.id);
            const visible = baseMap.isVisible({ layerGroups: { show: 'only', values: [group] } });
            controls.appendChild(controlFor(knob, visible, (value) => setGroupVisible(knob.id, value === true), group));
        }
        container.replaceChildren(element);
    };
    render();
    const rerender = perFrameApplier(render);
    baseMap.events.on('config-change', () => {
        if (!applyingFromPanel) rerender.queue();
    });

    return { render };
};
