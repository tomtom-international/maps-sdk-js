import {
    type MapColorName,
    mapColorNames,
    type StandardStyleID,
    type StylingKnobDescriptor,
    type StylingModule,
    type TomTomMap,
} from '@tomtom-org/maps-sdk/map';
import { sampleColors } from './sampleColors';

const colorKnobId = (name: MapColorName) => `colors.${name}` as const;

// The names Map Maker's Foundations panel shows for the same ten colours, so a designer recognises
// the control they set the colour on there. `mapColorNames` already carries Map Maker's order.
const MAP_COLOR_LABELS: Record<MapColorName, string> = {
    land: 'Land (base)',
    water: 'Water',
    vegetation: 'Vegetation',
    park: 'Park & Recreation',
    artificial: 'Artificial',
    roadMajor: 'Major Road',
    road: 'Road',
    roadOutline: 'Road Outline',
    label: 'Label',
    labelOutline: 'Label Outline',
};

// A colour the loaded style has no layer for says so, rather than showing a black swatch that reads
// as the colour black.
const labelFor = (name: MapColorName, available: boolean) =>
    available ? MAP_COLOR_LABELS[name] : `${MAP_COLOR_LABELS[name]} — not in this style`;

// `<input type="color">` takes `#rrggbb` and nothing else, while the knobs report the style's own
// literals — `hsl()`, and `hsla()` for the label halo. One canvas parses every CSS colour form; a
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

// The colour in force for a knob — the one set on it, or the loaded style's own until then.
const colorOf = (name: MapColorName, catalogue: Map<string, StylingKnobDescriptor>) => {
    const current = catalogue.get(colorKnobId(name))?.current;
    return typeof current === 'string' ? toHex(current) : undefined;
};

/** One picker per colour, kept in step with whatever the style and the other controls leave in force. */
export const initColorPickers = (styling: StylingModule, map: TomTomMap): void => {
    const catalogue = () => new Map(styling.describe().knobs.map((knob) => [knob.id, knob]));

    // A drag fires `input` far faster than a recolour can run, and one colour rewrites the paint of
    // every layer it reaches. Coalesce into one `setMapColors` per frame with the last value of each
    // colour winning, and flush on `change` so the colour the user released on lands at once.
    const pending = new Map<MapColorName, string>();
    let frame = 0;
    const applyPending = () => {
        frame = 0;
        if (!pending.size) return;

        const colors = Object.fromEntries(pending);
        pending.clear();
        styling.setMapColors(colors);
    };
    const queueColor = (name: MapColorName, value: string) => {
        pending.set(name, value);
        if (!frame) frame = requestAnimationFrame(applyPending);
    };
    const flushColors = () => {
        if (frame) cancelAnimationFrame(frame);

        applyPending();
    };

    // The swatch comes first so the ten line up, and each picker is born with the colour it shows:
    // a value written afterwards is lost whenever the page is re-mounted from its HTML, as the
    // docs-portal preview does. The hover text is the knob's own description.
    const pickers = new Map<MapColorName, { input: HTMLInputElement; label: HTMLElement }>();
    const container = document.querySelector('#ui-colors') as HTMLElement;
    const loaded = catalogue();
    for (const name of mapColorNames) {
        const hex = colorOf(name, loaded);
        const field = document.createElement('label');
        field.className = 'ui-form-field-inline';
        field.title = loaded.get(colorKnobId(name))?.description ?? '';
        field.innerHTML = `<span class="ui-color-swatch"><input type="color" value="${hex ?? '#000000'}"${hex ? '' : ' disabled'}></span><span class="ui-form-label"></span>`;
        const input = field.querySelector('input') as HTMLInputElement;
        input.addEventListener('input', () => queueColor(name, input.value));
        input.addEventListener('change', flushColors);
        const label = field.querySelector('.ui-form-label') as HTMLElement;
        label.textContent = labelFor(name, hex !== undefined);
        pickers.set(name, { input, label });
        container.appendChild(field);
    }

    // A value the input already holds is left alone, so the picker being dragged is never yanked back.
    const syncPickers = () => {
        const knobs = catalogue();
        for (const [name, { input, label }] of pickers) {
            const hex = colorOf(name, knobs);
            input.disabled = !hex;
            label.textContent = labelFor(name, hex !== undefined);
            if (hex && hex !== input.value) {
                input.value = hex;
                input.setAttribute('value', hex);
            }
        }
    };
    styling.events.on('config-change', syncPickers);
    // A new style brings its own ten colours, and may not have a layer for every one of them.
    map.addStyleChangeHandler({ onStyleChanged: syncPickers });
};

/** The sample palettes, each setting all ten colours at once and some of them the style under them. */
export const initSamplePalettes = (styling: StylingModule, map: TomTomMap, baseStyle: StandardStyleID): void => {
    const sampleSelector = document.querySelector('#ui-sample') as HTMLSelectElement;
    for (const sampleName of Object.keys(sampleColors)) {
        const option = document.createElement('option');
        option.value = sampleName;
        option.textContent = sampleName;
        sampleSelector.appendChild(option);
    }
    let styleId: StandardStyleID = baseStyle;
    sampleSelector.addEventListener('change', async () => {
        const sample = sampleColors[sampleSelector.value];
        // Reset before the switch, so the style loads under its own colours rather than flashing the
        // previous palette; the module re-applies whatever is set after a style change either way.
        styling.resetConfig();
        const wanted = sample?.style ?? baseStyle;
        if (wanted !== styleId) {
            // Loading a style takes a moment, and `setStyle` serialises: disable the selector for it
            // rather than let a run of switches queue up behind each other.
            sampleSelector.disabled = true;
            await map.setStyle(wanted);
            styleId = wanted;
            sampleSelector.disabled = false;
        }
        if (sample) styling.setMapColors(sample.colors);
    });
};

/** The rendered style, knobs applied, as a MapLibre style specification. */
export const initStyleExport = (styling: StylingModule): void => {
    document.querySelector('#ui-export')?.addEventListener('click', () => {
        const json = JSON.stringify(styling.exportStyle(), null, 2);
        window.open()?.document.write(`<pre>${json.replace(/</g, '&lt;')}</pre>`);
    });
};
