import {
    type BeforeLayerConfig,
    type MapStyleLayerID,
    mapStyleLayerIDs,
    type StandardStyleID,
    standardStyleIDs,
} from '@tomtom-org/maps-sdk/map';

// The mutable style + positioning the panel edits. index.ts feeds a copy into the GeometriesModule
// config: fill and border each carry their own color plus a `beforeLayerConfig`, so they can be
// styled and positioned in the layer stack independently.
export type GeometryStyleState = {
    fill: { color: string; opacity: number; beforeLayerConfig: BeforeLayerConfig };
    line: { color: string; width: number; beforeLayerConfig: BeforeLayerConfig };
};

type ControlsOptions = {
    state: GeometryStyleState;
    initialStyle: StandardStyleID;
    // Re-apply the current style/positioning to the map.
    apply: () => void;
    onStyleChange: (style: StandardStyleID) => void;
};

// Every predefined positioning target: 'top' (above all layers) plus each map-style layer key
// (insert the geometry layer BELOW that layer). These populate the "Below layer" dropdowns.
const LAYER_TARGETS: BeforeLayerConfig[] = ['top', ...(Object.keys(mapStyleLayerIDs) as MapStyleLayerID[])];

const getElement = <T extends HTMLElement>(id: string): T => document.getElementById(id) as T;

// Fill a "Below layer" dropdown with every target, preselecting the section's startup choice.
const addTargetOptions = (select: HTMLSelectElement, preselected: BeforeLayerConfig): void => {
    LAYER_TARGETS.forEach((target) => {
        const option = new Option(target, target);
        option.title = target === 'top' ? 'Above every map layer' : mapStyleLayerIDs[target];
        select.add(option);
    });
    select.value = preselected;
};

/** Wires every panel control: the fill/border sections, the map-style switcher, re-center, and the collapse toggle. */
export const initControls = ({ state, initialStyle, apply, onStyleChange }: ControlsOptions): void => {
    // Panel collapse/expand.
    const toggle = document.querySelector('.sdk-example-heading-toggle');
    const content = document.querySelector('.sdk-example-panel-content');
    toggle?.addEventListener('click', () => {
        const expanded = toggle.getAttribute('aria-expanded') === 'true';
        toggle.setAttribute('aria-expanded', expanded ? 'false' : 'true');
        content?.classList.toggle('collapsed');
    });

    // Fill + border sections: a color picker and a "Below layer" dropdown each.
    const fillColor = getElement<HTMLInputElement>('sdk-example-fillColor');
    const lineColor = getElement<HTMLInputElement>('sdk-example-lineColor');
    const fillLayer = getElement<HTMLSelectElement>('sdk-example-fillLayer');
    const lineLayer = getElement<HTMLSelectElement>('sdk-example-lineLayer');

    fillColor.value = state.fill.color;
    lineColor.value = state.line.color;
    addTargetOptions(fillLayer, state.fill.beforeLayerConfig);
    addTargetOptions(lineLayer, state.line.beforeLayerConfig);

    fillColor.addEventListener('input', () => {
        state.fill.color = fillColor.value;
        apply();
    });
    lineColor.addEventListener('input', () => {
        state.line.color = lineColor.value;
        apply();
    });
    fillLayer.addEventListener('change', () => {
        state.fill.beforeLayerConfig = fillLayer.value as BeforeLayerConfig;
        apply();
    });
    lineLayer.addEventListener('change', () => {
        state.line.beforeLayerConfig = lineLayer.value as BeforeLayerConfig;
        apply();
    });

    // Map-style switcher.
    const styles = getElement<HTMLSelectElement>('sdk-example-mapStyles');
    standardStyleIDs.forEach((id) => styles.add(new Option(id)));
    styles.value = initialStyle;
    styles.addEventListener('change', () => onStyleChange(styles.value as StandardStyleID));
};
