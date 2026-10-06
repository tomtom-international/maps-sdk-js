import {
    type BeforeLayerConfig,
    type GeometriesKnob,
    type GeometriesKnobId,
    type GeometryFillStyle,
    type GeometryHighlightConfig,
    geometriesKnobCatalogue,
    knobEntryOf,
    type MapStyleLayerID,
    mapStyleLayerIDs,
    type StandardStyleID,
    standardStyleIDs,
} from '@tomtom-org/maps-sdk/map';

// The mutable style + positioning the panel edits. index.ts feeds a copy into the GeometriesModule
// config: fill and border each carry their own color, and `beforeLayerConfig` a target for each, so
// they can be styled and positioned in the layer stack independently.
export type GeometryStyleState = {
    fill: { style: GeometryFillStyle; color: string; opacity: number };
    line: { color: string; width: number };
    beforeLayerConfig: { fill: BeforeLayerConfig; line: BeforeLayerConfig };
    // Unset factors keep the SDK's own, which the sliders start at.
    highlight: Required<GeometryHighlightConfig>;
};

type ControlsOptions = {
    state: GeometryStyleState;
    initialStyle: StandardStyleID;
    // Re-apply the current style/positioning to the map.
    apply: () => void;
    onStyleChange: (style: StandardStyleID) => void;
    onVisibleChange: (visible: boolean) => void;
    onClickedChange: (clicked: boolean) => void;
};

// Every predefined positioning target: 'top' (above all layers) plus each map-style layer key
// (insert the geometry layer BELOW that layer). These populate the "Below layer" dropdowns.
const LAYER_TARGETS: BeforeLayerConfig[] = ['top', ...(Object.keys(mapStyleLayerIDs) as MapStyleLayerID[])];

const getElement = <T extends HTMLElement>(id: string): T => document.getElementById(id) as T;

const knob = (id: GeometriesKnobId): GeometriesKnob => knobEntryOf(geometriesKnobCatalogue, id);

// A slider takes its bounds and step from the knob's catalogue range, its tooltip from the
// description, and its start from the catalogue default when no value is given.
const initSlider = (
    inputId: string,
    id: GeometriesKnobId,
    value: number | undefined,
    onInput: (value: number) => void,
): void => {
    const { range, description, default: knobDefault } = knob(id);
    const slider = getElement<HTMLInputElement>(inputId);
    const readout = getElement<HTMLElement>(`${inputId}-value`);
    if (range) {
        slider.min = String(range.min);
        slider.max = String(range.max);
        slider.step = String(range.step ?? 'any');
    }
    slider.title = description;
    slider.value = String(value ?? knobDefault);
    readout.textContent = slider.value;
    slider.addEventListener('input', () => {
        readout.textContent = slider.value;
        onInput(Number(slider.value));
    });
};

// Fill a "Below layer" dropdown with every target, preselecting the section's startup choice.
const addTargetOptions = (select: HTMLSelectElement, preselected: BeforeLayerConfig): void => {
    LAYER_TARGETS.forEach((target) => {
        const option = new Option(target, target);
        option.title = target === 'top' ? 'Above every map layer' : mapStyleLayerIDs[target];
        select.add(option);
    });
    select.value = preselected;
};

// The highlight section: the factor sliders, and the switch that draws the first geometry as clicked.
const initHighlightControls = (
    state: GeometryStyleState,
    apply: () => void,
    onClickedChange: (clicked: boolean) => void,
): void => {
    initSlider(
        'ui-highlightFillOpacity',
        'highlight.fill.opacityFactor',
        state.highlight.fill.opacityFactor,
        (factor) => {
            state.highlight.fill.opacityFactor = factor;
            apply();
        },
    );
    initSlider('ui-highlightLineWidth', 'highlight.line.widthFactor', state.highlight.line.widthFactor, (factor) => {
        state.highlight.line.widthFactor = factor;
        apply();
    });

    const clicked = getElement<HTMLInputElement>('ui-clicked');
    clicked.addEventListener('change', () => onClickedChange(clicked.checked));
};

/**
 * Wires every panel control: the fill/border/highlight sections and their catalogue-driven knobs,
 * the map-style switcher, the visibility and clicked switches, and the collapse toggle.
 */
export const initControls = ({
    state,
    initialStyle,
    apply,
    onStyleChange,
    onVisibleChange,
    onClickedChange,
}: ControlsOptions): void => {
    // Panel collapse/expand.
    const toggle = document.querySelector('.ui-heading-toggle');
    const content = document.querySelector('.ui-panel-content');
    toggle?.addEventListener('click', () => {
        const expanded = toggle.getAttribute('aria-expanded') === 'true';
        toggle.setAttribute('aria-expanded', expanded ? 'false' : 'true');
        content?.classList.toggle('collapsed');
    });

    // Fill + border sections: a color picker and a "Below layer" dropdown each.
    const fillColor = getElement<HTMLInputElement>('ui-fillColor');
    const lineColor = getElement<HTMLInputElement>('ui-lineColor');
    const fillLayer = getElement<HTMLSelectElement>('ui-fillLayer');
    const lineLayer = getElement<HTMLSelectElement>('ui-lineLayer');

    fillColor.value = state.fill.color;
    lineColor.value = state.line.color;
    addTargetOptions(fillLayer, state.beforeLayerConfig.fill);
    addTargetOptions(lineLayer, state.beforeLayerConfig.line);

    fillColor.addEventListener('input', () => {
        state.fill.color = fillColor.value;
        apply();
    });
    lineColor.addEventListener('input', () => {
        state.line.color = lineColor.value;
        apply();
    });
    fillLayer.addEventListener('change', () => {
        state.beforeLayerConfig.fill = fillLayer.value as BeforeLayerConfig;
        apply();
    });
    lineLayer.addEventListener('change', () => {
        state.beforeLayerConfig.line = lineLayer.value as BeforeLayerConfig;
        apply();
    });

    // The fill style select lists the knob's catalogue options; the sliders follow its ranges.
    const fillStyle = getElement<HTMLSelectElement>('ui-fillStyle');
    const { options, description } = knob('fill.style');
    options?.forEach((option) => fillStyle.add(new Option(option)));
    fillStyle.title = description;
    fillStyle.value = state.fill.style;
    fillStyle.addEventListener('change', () => {
        state.fill.style = fillStyle.value as GeometryFillStyle;
        apply();
    });
    initSlider('ui-fillOpacity', 'fill.opacity', state.fill.opacity, (opacity) => {
        state.fill.opacity = opacity;
        apply();
    });
    initSlider('ui-lineWidth', 'line.width', state.line.width, (width) => {
        state.line.width = width;
        apply();
    });
    initHighlightControls(state, apply, onClickedChange);

    // Map-style switcher.
    const styles = getElement<HTMLSelectElement>('ui-mapStyles');
    standardStyleIDs.forEach((id) => styles.add(new Option(id)));
    styles.value = initialStyle;
    styles.addEventListener('change', () => onStyleChange(styles.value as StandardStyleID));

    const visible = getElement<HTMLInputElement>('ui-visible');
    visible.addEventListener('change', () => onVisibleChange(visible.checked));
};
