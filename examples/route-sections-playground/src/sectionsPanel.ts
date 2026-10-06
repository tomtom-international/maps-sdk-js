import type {
    CountryCrossingAlignment,
    DrawnSectionType,
    RouteWidth,
    SectionDrawStyle,
    SectionLinePattern,
    SectionSignPlacement,
    SectionSignPriority,
    SectionSignUnit,
    TomTomMap,
} from '@tomtom-org/maps-sdk/map';
import {
    bespokeSectionTypes,
    generatedSectionTypes,
    knobEntryOf,
    routingKnobCatalogue,
    sectionDrawsByDefault,
    sectionSupportsKnob,
} from '@tomtom-org/maps-sdk/map';
import type { PanelState } from './sectionsConfig';

// The line layer each type is drawn with, so the panel can read the colour and opacity the SDK gave
// that type back off the map. The generated types follow one naming rule; the other five are named.
const BESPOKE_LINE_LAYERS: Partial<Record<DrawnSectionType, string>> = {
    ferry: 'routeFerryLine',
    tollRoad: 'routeTollRoadOutline',
    traffic: 'routeIncidentBackgroundLine',
    tunnel: 'routeTunnelLine',
    vehicleRestricted: 'routeVehicleRestrictedForegroundLine',
};

const findLineLayerID = (map: TomTomMap, type: DrawnSectionType): string | undefined => {
    const suffix = BESPOKE_LINE_LAYERS[type] ?? `routeSection${type.charAt(0).toUpperCase()}${type.slice(1)}Line`;
    return map.mapLibreMap.getStyle().layers.find((layer) => layer.id.endsWith(suffix))?.id;
};

const controlFor = (type: DrawnSectionType, knob: string) =>
    document.querySelector<HTMLInputElement>(`[data-knob="${knob}"][data-type="${type}"]`);

// The selects this panel offers, each with the label of its empty entry, which leaves the knob
// unset; `sign.placement` has none.
const SELECT_UNSET_LABELS: Record<string, string | null> = {
    widthPreset: 'route',
    style: 'default',
    pattern: 'default',
    'sign.placement': null,
    'sign.priority': 'default for placement',
    'sign.unit': "each sign's own country",
};

const OPTION_LABELS: Record<string, string> = {
    atChange: 'at each change',
    along: 'along the stretch',
    belowMapLabels: 'below map labels',
    belowRouteIcons: 'below route icons',
    aboveRouteIcons: 'above route icons',
    'km/h': 'km/h everywhere',
    mph: 'mph everywhere',
};

const selectKnob = (type: DrawnSectionType, knob: string, options: readonly string[], unsetLabel: string | null) => `
    <label class="section-knob">
        <span class="section-knob-name">${knob}</span>
        <select class="ui-dropdown" data-type="${type}" data-knob="${knob}">
            ${unsetLabel === null ? '' : `<option value="">${unsetLabel}</option>`}${options
                .map((option) => `<option value="${option}">${OPTION_LABELS[option] ?? option}</option>`)
                .join('')}
        </select>
    </label>`;

// `routingKnobCatalogue` lists only the knobs a type answers to, with the values each takes.
const enumKnobControls = (type: DrawnSectionType): string[] =>
    routingKnobCatalogue.flatMap(({ id, kind, options }) => {
        const knob = id.slice(`sections.${type}.`.length);
        const unsetLabel = SELECT_UNSET_LABELS[knob];
        if (!id.startsWith(`sections.${type}.`) || kind !== 'enum' || unsetLabel === undefined) return [];
        return selectKnob(type, knob, options, unsetLabel);
    });

const knobControls = (type: DrawnSectionType): string =>
    [
        ...enumKnobControls(type),
        sectionSupportsKnob(type, 'opacity') &&
            `<label class="section-knob section-knob-wide">
                <span class="section-knob-name">opacity</span>
                <span class="ui-slider-container">
                    <input type="range" class="ui-slider" data-type="${type}" data-knob="opacity"
                        min="10" max="100" step="5">
                    <span class="ui-slider-value" data-readout="${type}"></span>
                </span>
            </label>`,
        // 5 to 14, where a sign reads, rather than the catalogue's 0 to 22.
        sectionSupportsKnob(type, 'sign') &&
            `<label class="section-knob section-knob-wide">
                <span class="section-knob-name">sign.minZoom</span>
                <span class="ui-slider-container">
                    <input type="range" class="ui-slider" data-type="${type}" data-knob="sign.minZoom"
                        min="5" max="14" step="1"
                        value="${knobEntryOf(routingKnobCatalogue, `sections.${type}.sign.minZoom`).default}">
                    <span class="ui-slider-value" data-readout="${type}-sign-minZoom"></span>
                </span>
            </label>`,
    ]
        .filter(Boolean)
        .join('');

const rowMarkup = (type: DrawnSectionType): string => `
    <div class="section-row" data-row="${type}">
        <label class="ui-checkbox-label section-name">
            <input type="checkbox" data-type="${type}" data-knob="visible">
            <span>${type}</span>
        </label>
        <span class="section-count" title="sections of this type on this route: click for where the next one starts"></span>
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
    if (countCell) {
        countCell.textContent = String(sectionCount);
        // A count with stretches behind it steps the camera through them.
        if (sectionCount > 0) {
            countCell.setAttribute('role', 'button');
            countCell.setAttribute('tabindex', '0');
        } else {
            countCell.removeAttribute('role');
            countCell.removeAttribute('tabindex');
        }
    }

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

    const signMinZoomInput = controlFor(type, 'sign.minZoom');
    const signMinZoomReadout = document.querySelector(`[data-readout="${type}-sign-minZoom"]`);
    if (signMinZoomReadout && signMinZoomInput) signMinZoomReadout.textContent = `z${signMinZoomInput.value}`;

    document.querySelector(`[data-row="${type}"]`)?.classList.toggle('enabled', isDrawn(type, state));
};

const readSectionKnob = (target: HTMLInputElement | HTMLSelectElement, state: PanelState): void => {
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
        case 'widthPreset':
            section.widthPreset = (target.value || undefined) as RouteWidth | undefined;
            break;
        case 'style':
            section.style = (target.value || undefined) as SectionDrawStyle | undefined;
            break;
        case 'pattern':
            section.pattern = (target.value || undefined) as SectionLinePattern | undefined;
            break;
        case 'sign.placement':
            section.sign = { ...section.sign, placement: target.value as SectionSignPlacement };
            break;
        case 'sign.priority':
            section.sign = { ...section.sign, priority: (target.value || undefined) as SectionSignPriority };
            break;
        case 'sign.minZoom':
            section.sign = { ...section.sign, minZoom: Number(target.value) };
            break;
        case 'sign.unit':
            section.sign = { ...section.sign, unit: (target.value || undefined) as SectionSignUnit | undefined };
            break;
    }
    syncRow(type, state);
};

// The crossings are not a section type, so their row is written in the HTML and keyed on its own
// attribute. Same three knobs as a section row, minus the ones only a line can answer to.
const initCrossingRow = (state: PanelState, apply: () => void): void => {
    const row = document.getElementById('country-crossing-row')!;
    const minZoomReadout = document.querySelector('[data-readout="countryCrossings-minZoom"]')!;

    const syncReadout = (): void => {
        const minZoom = row.querySelector<HTMLInputElement>('[data-crossing-knob="minZoom"]')!;
        minZoomReadout.textContent = `z${minZoom.value}`;
    };

    const readCrossingKnob = (target: HTMLInputElement | HTMLSelectElement): void => {
        switch (target.dataset.crossingKnob) {
            case 'visible':
                state.countryCrossings.visible = (target as HTMLInputElement).checked;
                break;
            case 'color':
                state.countryCrossings.color = target.value;
                break;
            case 'label.color':
                state.countryCrossings.label = { color: target.value };
                break;
            case 'alignment':
                state.countryCrossings.alignment = target.value as CountryCrossingAlignment;
                break;
            case 'minZoom':
                state.countryCrossings.minZoom = Number(target.value);
                break;
        }
        syncReadout();
    };

    syncReadout();
    for (const eventName of ['change', 'input']) {
        row.addEventListener(eventName, (event) => {
            readCrossingKnob(event.target as HTMLInputElement | HTMLSelectElement);
            apply();
        });
    }
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

/** How much of each thing the route on the map has, which a route change refreshes. */
export type PanelCounts = {
    sections: Record<DrawnSectionType, number>;
    crossings: number;
};

/** What the panel hands back, so a new route can refresh the counts it shows. */
export type SectionsPanel = {
    setCounts: (counts: PanelCounts) => void;
    /** Writes what the last clicked crossing joins under the crossing row. */
    setCrossingDetail: (detail: string) => void;
};

export const initSectionsPanel = (options: {
    map: TomTomMap;
    state: PanelState;
    counts: PanelCounts;
    apply: () => void;
    /** Moves the camera to where the next stretch of the type starts. */
    showNextStretch: (type: DrawnSectionType) => void;
}): SectionsPanel => {
    const { map, state, counts, apply, showNextStretch } = options;

    // The two groups differ only in where they start, and which type sits in which is the module's
    // answer rather than this panel's — `sectionDrawsByDefault` is the same registry field the
    // module paints visibility from. Same knobs either way.
    const allTypes = [...bespokeSectionTypes, ...generatedSectionTypes];

    const rowsFor = (types: readonly DrawnSectionType[]) => types.map(rowMarkup).join('');

    const drawnRows = document.getElementById('drawn-section-rows')!;
    const optInRows = document.getElementById('opt-in-section-rows')!;

    drawnRows.innerHTML = rowsFor(allTypes.filter(sectionDrawsByDefault));
    optInRows.innerHTML = rowsFor(allTypes.filter((type) => !sectionDrawsByDefault(type)));

    const crossingCount = document.querySelector('#country-crossing-row .section-count')!;

    const setCounts = (updated: PanelCounts): void => {
        for (const type of allTypes) applySectionCount(type, updated.sections[type]);

        crossingCount.textContent = String(updated.crossings);
    };

    setCounts(counts);
    seedControlsFromMap(map, allTypes);
    for (const type of allTypes) syncRow(type, state);
    initCrossingRow(state, apply);

    for (const eventName of ['change', 'input']) {
        for (const rows of [drawnRows, optInRows]) {
            rows.addEventListener(eventName, (event) => {
                readSectionKnob(event.target as HTMLInputElement | HTMLSelectElement, state);
                apply();
            });
        }
    }

    const onCountPressed = (event: Event): void => {
        if (event instanceof KeyboardEvent && event.key !== 'Enter') return;

        const countCell = (event.target as HTMLElement).closest('.section-count[role="button"]');
        const type = countCell?.closest<HTMLElement>('[data-row]')?.dataset.row;
        if (type) showNextStretch(type as DrawnSectionType);
    };
    for (const rows of [drawnRows, optInRows]) {
        rows.addEventListener('click', onCountPressed);
        rows.addEventListener('keydown', onCountPressed);
    }

    initPanelToggle();

    const crossingDetail = document.getElementById('crossing-detail')!;

    return {
        setCounts,
        setCrossingDetail: (detail: string) => {
            crossingDetail.textContent = detail;
        },
    };
};
