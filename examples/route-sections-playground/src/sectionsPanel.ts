import type {
    DrawnSectionType,
    RouteWidth,
    SectionDrawStyle,
    SectionLinePattern,
    SectionSignPriority,
    TomTomMap,
} from '@tomtom-org/maps-sdk/map';
import {
    bespokeSectionTypes,
    generatedSectionTypes,
    sectionDrawsByDefault,
    sectionSupportsKnob,
} from '@tomtom-org/maps-sdk/map';
import type { PanelState } from './sectionsConfig';
import { PLAYGROUND_SIGN_MINZOOM } from './sectionsConfig';

// The line layer each type is drawn with, so the panel can read the colour and opacity the SDK gave
// that type back off the map. The generated types follow one rule; the other five are named.
const LINE_LAYER_SUFFIXES: Record<DrawnSectionType, string> = {
    ...(Object.fromEntries(
        generatedSectionTypes.map((type) => [type, `routeSection${type.charAt(0).toUpperCase()}${type.slice(1)}Line`]),
    ) as Record<DrawnSectionType, string>),
    ferry: 'routeFerryLine',
    tollRoad: 'routeTollRoadOutline',
    traffic: 'routeIncidentBackgroundLine',
    tunnel: 'routeTunnelLine',
    vehicleRestricted: 'routeVehicleRestrictedForegroundLine',
};

const findLineLayerID = (map: TomTomMap, type: DrawnSectionType): string | undefined =>
    map.mapLibreMap.getStyle().layers.find((layer) => layer.id.endsWith(LINE_LAYER_SUFFIXES[type]))?.id;

const controlFor = (type: DrawnSectionType, knob: string) =>
    document.querySelector<HTMLInputElement>(`[data-knob="${knob}"][data-type="${type}"]`);

// A `<select>` per knob, labelled so it cannot be mistaken for the one beside it.
const selectKnob = (type: DrawnSectionType, knob: string, options: readonly [string, string][]): string => `
    <label class="section-knob">
        <span class="section-knob-name">${knob}</span>
        <select class="ui-dropdown" data-type="${type}" data-knob="${knob}">
            ${options.map(([value, label]) => `<option value="${value}">${label}</option>`).join('')}
        </select>
    </label>`;

// The type that posts its number on a sign draws nothing else, so the row's own checkbox is its
// on/off. What is left worth playing with is how early the signs appear, and what they give way to
// when two symbols want the same spot.
const signKnobControls = (type: DrawnSectionType): string => `
    ${selectKnob(type, 'sign.priority', [
        ['belowRouteIcons', 'below route icons'],
        ['belowMapLabels', 'below map labels'],
        ['aboveRouteIcons', 'above route icons'],
    ])}
    <label class="section-knob section-knob-wide">
        <span class="section-knob-name">sign.minzoom</span>
        <span class="ui-slider-container">
            <input type="range" class="ui-slider" data-type="${type}" data-knob="sign.minzoom"
                min="5" max="14" step="1" value="${PLAYGROUND_SIGN_MINZOOM}">
            <span class="ui-slider-value" data-readout="${type}-sign-minzoom"></span>
        </span>
    </label>`;

// Only the knobs the type answers to: `sectionSupportsKnob` is the same catalogue the SDK applies
// paint from, so a control here cannot be one the section ignores. `traffic` gets no colour or
// pattern — it colours its line by how bad the delay is and dashes it by severity.
const knobControls = (type: DrawnSectionType): string =>
    [
        sectionSupportsKnob(type, 'width') &&
            selectKnob(type, 'width', [
                ['', 'route'],
                ['s', 's'],
                ['m', 'm'],
                ['l', 'l'],
            ]),
        sectionSupportsKnob(type, 'style') &&
            selectKnob(type, 'style', [
                ['', 'default'],
                ['halo', 'halo'],
                ['inline', 'inline'],
            ]),
        sectionSupportsKnob(type, 'pattern') &&
            selectKnob(type, 'pattern', [
                ['', 'default'],
                ['solid', 'solid'],
                ['dashed', 'dashed'],
                ['dotted', 'dotted'],
            ]),
        sectionSupportsKnob(type, 'opacity') &&
            `<label class="section-knob section-knob-wide">
                <span class="section-knob-name">opacity</span>
                <span class="ui-slider-container">
                    <input type="range" class="ui-slider" data-type="${type}" data-knob="opacity"
                        min="10" max="100" step="5">
                    <span class="ui-slider-value" data-readout="${type}"></span>
                </span>
            </label>`,
        sectionSupportsKnob(type, 'sign') && signKnobControls(type),
    ]
        .filter(Boolean)
        .join('');

const rowMarkup = (type: DrawnSectionType): string => `
    <div class="section-row" data-row="${type}">
        <label class="ui-checkbox-label section-name">
            <input type="checkbox" data-type="${type}" data-knob="visible">
            <span>${type}</span>
        </label>
        <span class="section-count" title="sections of this type on this route"></span>
        ${
            sectionSupportsKnob(type, 'color')
                ? `<span class="ui-color-swatch"><input type="color" data-type="${type}" data-knob="color"></span>`
                : '<span class="section-no-color" title="this type colours itself from its own data"></span>'
        }
        <div class="section-knobs">${knobControls(type)}</div>
    </div>`;

// The per-type colour and opacity are the SDK's own, so the controls start where the rendered layer
// already is. The state stays empty until a control moves, which keeps the config below showing
// only what was actually asked for.
const seedControlsFromMap = (map: TomTomMap, types: readonly DrawnSectionType[]): void => {
    for (const type of types) {
        const layerID = findLineLayerID(map, type);
        if (!layerID) continue;

        const color = map.mapLibreMap.getPaintProperty(layerID, 'line-color');
        const opacity = map.mapLibreMap.getPaintProperty(layerID, 'line-opacity');
        const colorInput = controlFor(type, 'color');
        const opacityInput = controlFor(type, 'opacity');
        if (colorInput && typeof color === 'string') colorInput.value = color;

        if (opacityInput && typeof opacity === 'number') opacityInput.value = String(Math.round(opacity * 100));
    }
};

// How many stretches of the type the route on the map has, and whether it can be asked for at all.
// Written in place rather than by re-rendering the row, so a route change keeps every knob where
// the reader left it.
const applySectionCount = (type: DrawnSectionType, sectionCount: number): void => {
    const countCell = document.querySelector(`[data-row="${type}"] .section-count`);
    if (countCell) countCell.textContent = String(sectionCount);

    const checkbox = controlFor(type, 'visible');
    if (checkbox) checkbox.disabled = sectionCount === 0;
};

const isDrawn = (type: DrawnSectionType, state: PanelState): boolean =>
    state.sections[type].visible ?? sectionDrawsByDefault(type);

const syncRow = (type: DrawnSectionType, state: PanelState): void => {
    const checkbox = controlFor(type, 'visible');
    if (checkbox) checkbox.checked = isDrawn(type, state);

    const opacityInput = controlFor(type, 'opacity');
    const readout = document.querySelector(`[data-readout="${type}"]`);
    if (readout && opacityInput) readout.textContent = `${opacityInput.value}%`;

    const signMinzoomInput = controlFor(type, 'sign.minzoom');
    const signMinzoomReadout = document.querySelector(`[data-readout="${type}-sign-minzoom"]`);
    if (signMinzoomReadout && signMinzoomInput) signMinzoomReadout.textContent = `z${signMinzoomInput.value}`;

    document.querySelector(`[data-row="${type}"]`)?.classList.toggle('enabled', isDrawn(type, state));
};

const readKnob = (target: HTMLInputElement | HTMLSelectElement, state: PanelState): void => {
    const type = target.dataset.type as DrawnSectionType;
    const section = state.sections[type];
    switch (target.dataset.knob) {
        case 'visible':
            section.visible = (target as HTMLInputElement).checked;
            break;
        case 'color':
            section.color = target.value;
            break;
        case 'opacity':
            section.opacity = Number(target.value) / 100;
            break;
        case 'width':
            section.width = (target.value || undefined) as RouteWidth | undefined;
            break;
        case 'style':
            section.style = (target.value || undefined) as SectionDrawStyle | undefined;
            break;
        case 'pattern':
            section.pattern = (target.value || undefined) as SectionLinePattern | undefined;
            break;
        case 'sign.priority':
            section.sign = { ...section.sign, priority: target.value as SectionSignPriority };
            break;
        case 'sign.minzoom':
            section.sign = { ...section.sign, minzoom: Number(target.value) };
            break;
    }
    syncRow(type, state);
};

const initPanelToggle = (): void => {
    const toggleButton = document.querySelector('.ui-heading-toggle')!;
    const panelContent = document.querySelector('.ui-panel-content')!;
    toggleButton.addEventListener('click', () => {
        const isExpanded = toggleButton.getAttribute('aria-expanded') === 'true';
        toggleButton.setAttribute('aria-expanded', isExpanded ? 'false' : 'true');
        panelContent.classList.toggle('collapsed');
    });
};

/** What the panel hands back, so a new route can refresh the per-type counts it shows. */
export type SectionsPanel = {
    setSectionCounts: (sectionCounts: Record<DrawnSectionType, number>) => void;
};

export const initSectionsPanel = (options: {
    map: TomTomMap;
    state: PanelState;
    sectionCounts: Record<DrawnSectionType, number>;
    apply: () => void;
}): SectionsPanel => {
    const { map, state, sectionCounts, apply } = options;

    // The two groups differ only in where they start, and which type sits in which is the module's
    // answer rather than this panel's — `sectionDrawsByDefault` is the same registry field the
    // module paints visibility from. Same knobs either way.
    const allTypes = [...bespokeSectionTypes, ...generatedSectionTypes];

    const rowsFor = (types: readonly DrawnSectionType[]) => types.map(rowMarkup).join('');

    const drawnRows = document.getElementById('drawn-section-rows')!;
    const optInRows = document.getElementById('opt-in-section-rows')!;

    drawnRows.innerHTML = rowsFor(allTypes.filter(sectionDrawsByDefault));
    optInRows.innerHTML = rowsFor(allTypes.filter((type) => !sectionDrawsByDefault(type)));

    const setSectionCounts = (counts: Record<DrawnSectionType, number>): void => {
        for (const type of allTypes) applySectionCount(type, counts[type]);
    };

    setSectionCounts(sectionCounts);
    seedControlsFromMap(map, allTypes);
    for (const type of allTypes) syncRow(type, state);

    for (const eventName of ['change', 'input']) {
        for (const rows of [drawnRows, optInRows]) {
            rows.addEventListener(eventName, (event) => {
                readKnob(event.target as HTMLInputElement | HTMLSelectElement, state);
                apply();
            });
        }
    }

    initPanelToggle();

    return { setSectionCounts };
};
