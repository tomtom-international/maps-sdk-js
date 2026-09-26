import type {
    LayerSpecification,
    MapGeoJSONFeature,
    ProjectionSpecification,
    SkySpecification,
    SourceSpecification,
    StyleSpecification,
} from 'maplibre-gl';
import { DEFAULT_STYLE_VERSION } from '../init';
import { AbstractStyleOwnedMapModule, type CombinedEvents, knob, type LightDark, sharedInstance } from '../shared';
import { matchesAnyLayerSelector } from '../shared/layers/layerSelector';
import { waitUntilMapIsReady } from '../shared/mapUtils';
import type { TomTomMap } from '../TomTomMap';
import { hslShiftBetween, isColorLiteral, shiftHsl } from '../utils/colorUtils';
import { type LiteralOwnership, type MapColorBid, pickAnchorLiteral, recolorValue } from './colorRewrite';
import { scaleNumericValue, shiftZoomOffset } from './expressionTransforms';
import {
    type ColorProperty,
    type KnobDefinition,
    type KnobMechanism,
    knobDefinitions,
    type LiteralProperty,
    literalPaintProperties,
    type ScalableProperty,
    type StylingKnobId,
    type StylingKnobValueOf,
    stylingKnobIds,
} from './knobCatalogue';
import { LayerOverrides, type LayerQuery, LayerSelection, type RuntimeLayerProperties } from './layerQuery';
import {
    isMapColorName,
    type MapColorName,
    type MapColors,
    type MapColorTarget,
    mapColorDefinitions,
    mapColorNames,
    type PaintColorProperty,
    paintColorProperties,
} from './mapColorCatalogue';
import { type StylingPresetId, stylingPresetIds, stylingPresets } from './presets';
import type {
    StylingCatalogue,
    StylingKnobDescriptor,
    StylingKnobValue,
    StylingPresetDescriptor,
    StylingSettings,
} from './types/stylingTypes';

/**
 * Event surface of {@link StylingModule}: it owns no map features, so only the lifecycle half is
 * live — `config-change` fires with the full {@link StylingSettings} after every knob change.
 *
 * @group Map Styling
 */
export type StylingEvents = CombinedEvents<MapGeoJSONFeature, StylingSettings, never>;

// Layer properties the knobs read at style load and rewrite afterwards. A layer's filter is not
// among them: the knob that rewrites it goes through the shared `LayerFilterComposer`, which holds
// the style's own filter for every contributor that narrows the same layer.
type LayerProperty = ScalableProperty | PaintColorProperty | LiteralProperty | 'visibility' | 'minzoom' | 'maxzoom';

// A layer's zoom range is always a number in the style spec, while every other property can hold an
// expression the knobs pass through untouched — so those stay `unknown` and only the zoom keys carry
// a value type worth promising.
type ZoomProperty = 'minzoom' | 'maxzoom';
type LayerPropertyValue<PROPERTY extends LayerProperty> = PROPERTY extends ZoomProperty ? number : unknown;

// The end of a layer's zoom range each zoom mechanism sets.
const ZOOM_BOUNDS = { minZoom: 'minzoom', maxZoom: 'maxzoom' } as const satisfies Record<
    Extract<KnobMechanism['type'], 'minZoom' | 'maxZoom'>,
    ZoomProperty
>;

// This module's key with the filter composer — one per mechanism that writes a filter.
const ZOOM_SHIFT_CONTRIBUTOR = 'styling.zoomShift';

// Which of MapLibre's two setters a property goes through. A property in neither set is written
// nowhere, so the colour and literal halves come off their catalogues rather than being listed again.
const LAYOUT_PROPERTIES: ReadonlySet<LayerProperty> = new Set(['text-size', 'icon-size', 'visibility']);
const PAINT_PROPERTIES: ReadonlySet<LayerProperty> = new Set<LayerProperty>([
    'line-width',
    ...paintColorProperties,
    ...literalPaintProperties,
]);

// The ten knob ids the map colours own, one per semantic colour. Taken out of the knob ids rather
// than spelled again, so a colour the catalogue never gave a knob stops compiling here.
type MapColorKnobId = Extract<StylingKnobId, `colors.${MapColorName}`>;
// One (layer, property) a map-colour knob rewrites, with the ownership rule for literals inside it.
type MapColorTargetInstance = {
    knobId: MapColorKnobId;
    layerId: string;
    property: PaintColorProperty;
    owns: LiteralOwnership;
};

// The style spec's own defaults, used when a layer relies on them instead of spelling the value out.
// `satisfies` rather than an annotation, so the zoom defaults read back as numbers and the callers
// that fall back to them need no cast.
const SPEC_DEFAULTS = {
    'text-size': 16,
    'icon-size': 1,
    'line-width': 1,
    visibility: 'visible',
    minzoom: 0,
    maxzoom: 24,
    'hillshade-method': 'standard',
    'hillshade-illumination-direction': 335,
    'hillshade-exaggeration': 0.5,
    'hillshade-shadow-color': '#000000',
    'hillshade-highlight-color': '#FFFFFF',
    'hillshade-accent-color': '#000000',
} satisfies { [PROPERTY in LayerProperty]?: LayerPropertyValue<PROPERTY> };

const hasSpecDefault = (property: LayerProperty): property is keyof typeof SPEC_DEFAULTS => property in SPEC_DEFAULTS;

// The mechanisms that rewrite each of their layers on its own, whatever the others hold.
type LayerByLayerMechanism = Extract<
    KnobMechanism,
    { type: 'scale' | 'visibility' | 'minZoom' | 'maxZoom' | 'paintLiteral' | 'zoomOffset' }
>;

// Which layers a mechanism reaches in the loaded style.
type ResolvedMechanism = { mechanism: KnobMechanism; layerIds: string[]; shadeLayerIds: string[] };
type ResolvedKnob = { definition: KnobDefinition; mechanisms: ResolvedMechanism[]; targets: number };

const targetKey = (layerId: string, property: LayerProperty) => `${layerId}|${property}`;

// A map-level knob reaches the map itself rather than a layer, so it stands in for its one target
// under a layer id no style can have. What it captured lives in `mapLevelState`, typed.
const MAP_LEVEL = '\u0000map';

// Everything MapLibre accepts as a projection, which is a plain name only in the simple case.
type ProjectionValue = ProjectionSpecification['type'];

// The map-level state the view knobs own, as the loaded style declares it before a knob touches it.
type MapLevelState = {
    projection: ProjectionValue;
    sky: SkySpecification | undefined;
};

// Our own sky, with both colours as literals rather than expressions — which is what lets
// `describe()` report them as the knob's default value.
type SkyDefaults = SkySpecification & { 'sky-color': string; 'horizon-color': string };

// The sky the atmosphere is drawn in, per light/dark theme of the loaded style: a daylit blue with a
// white horizon over a light map, a night blue with a dim horizon over a dark one. A light sky behind
// a dark map reads as a halo around the globe rather than as atmosphere.
const SKY_DEFAULTS: Record<LightDark, SkyDefaults> = {
    light: {
        'sky-color': '#88c6fc',
        'horizon-color': '#ffffff',
        'sky-horizon-blend': 0.8,
        'atmosphere-blend': 0.8,
        'fog-color': '#ffffff',
        'fog-ground-blend': 0.5,
        'horizon-fog-blend': 0.8,
    },
    dark: {
        'sky-color': '#0a1626',
        'horizon-color': '#2b4a72',
        'sky-horizon-blend': 0.8,
        'atmosphere-blend': 0.8,
        'fog-color': '#0a1626',
        'fog-ground-blend': 0.5,
        'horizon-fog-blend': 0.8,
    },
};

// What shows around a globe, where the map canvas is transparent and the page would otherwise show
// through. Matches the sky, so the planet sits in air of the same colour it is lit by. Only used
// where the page paints nothing of its own behind the map.
const SPACE_COLOR_DEFAULTS: Record<LightDark, string> = { light: '#ffffff', dark: '#0a1626' };

// What a computed `background-color` reads as on a container the page never painted.
const UNPAINTED_BACKGROUNDS = new Set(['', 'transparent', 'rgba(0, 0, 0, 0)']);

// The sky MapLibre draws for a style without one, written out because `setSky` has no "unset".
const CLEAR_SKY: SkySpecification = {
    'sky-color': 'transparent',
    'horizon-color': 'transparent',
    'fog-color': 'transparent',
    'fog-ground-blend': 1,
    'atmosphere-blend': 0,
};

/**
 * Semantic styling of the base map, traffic and POIs — the tier between hiding a layer group and
 * hand-editing MapLibre layers.
 *
 * Every adjustable thing is a **knob** with a stable id, a kind, a range and a default read from the
 * loaded style. {@link describe} returns that catalogue as data, so a UI or an AI agent can build
 * controls, validate values and diff state without knowing anything about the style's layers.
 *
 * @remarks
 * **Which styles a knob works on** is `appliesTo` in the catalogue. `any-style` knobs (sizes,
 * widths) wrap whatever the style already does — `text-size: E` becomes `["*", 1.3, E]` — so they
 * work on a custom style too. `tomtom-styles` knobs (toggles, colours) reach their layers through
 * the TomTom styles this SDK version is verified against; on any other style they report
 * `available: false`, warn once and do nothing rather than failing silently.
 *
 * **Style changes.** Settings are re-applied after every `setStyle` that carries state over, on top of
 * whatever the other modules restored, and dropped on a clean switch (`resetState: true`).
 *
 * **Interplay with other modules.** Toggles set layer visibility, as {@link BaseMapModule} and
 * {@link POIsModule} do for whole groups; the later call wins. `pois.zoomShift` rewrites the POI
 * layer filters, which {@link POIsModule.filterCategories} also narrows: the two compose, so either
 * can be set at any time and neither drops the other.
 *
 * @example
 * ```typescript
 * import { StylingModule } from '@tomtom-org/maps-sdk/map';
 *
 * const styling = await StylingModule.get(map);
 * styling.set('labels.sizeFactor', 1.2);
 * styling.set('roads.exitNumbers', false);
 * styling.set('traffic.flow.slowColor', '#f59e0b');
 *
 * // Everything a control panel or an agent needs, as data:
 * for (const knob of styling.describe().knobs) {
 *   console.log(knob.id, knob.kind, knob.range, knob.current);
 * }
 *
 * // Serializable, diffable, re-applicable:
 * const saved = styling.getConfig();
 * styling.resetConfig();
 * styling.applyConfig(saved);
 * ```
 *
 * @see [Map Styling Guide](https://docs.tomtom.com/maps-sdk-js/guides/map/styling)
 *
 * @group Map Styling
 */
export class StylingModule extends AbstractStyleOwnedMapModule<Record<string, never>, StylingSettings> {
    // The style's own values for every (layer, property) a knob may touch, captured at style load.
    // Declared without initialisers on purpose: the base constructor already runs `indexStyle`
    // (through `_initSourcesWithLayers`), and a field initialiser would wipe its work afterwards.
    private originalValues!: Map<string, unknown>;
    private mapLevelState!: MapLevelState;
    private styleSources!: Record<string, SourceSpecification>;
    private resolved!: Map<StylingKnobId, ResolvedKnob>;
    // Scale knobs compose: a (layer, property) reached by several of them gets their product.
    private scaleKnobsByTarget!: Map<string, StylingKnobId[]>;
    // Map-colour knobs compose too: tunnels draw major and minor roads in one expression.
    private mapColorTargetsByKey!: Map<string, MapColorTargetInstance[]>;
    private mapColorTargetsByKnob!: Map<StylingKnobId, MapColorTargetInstance[]>;
    // Per colour, the style's own literal its shades are measured from.
    private mapColorAnchors!: Map<StylingKnobId, string>;
    private warned!: Set<string>;
    // Set while the style has just been indexed, so the next `_applyConfig` re-applies every knob
    // rather than only the ones whose value moved.
    private reindexed!: boolean;
    // What the page painted behind the map before this module first painted over it: the value
    // `view.spaceColor` reports as its default and resets to, empty when the page painted nothing.
    // Captured once — by the second style load the container already carries this module's colour.
    private originalSpaceColor: string | undefined;
    private layerOverrides!: LayerOverrides;

    /**
     * Retrieves the styling module of the given map, creating it on first use.
     *
     * @param map - The TomTomMap instance to style.
     * @param settings - Optional knob values to apply right away, e.g. restored from storage.
     * @returns A promise that resolves once the map style is loaded and the settings are applied.
     *
     * @remarks
     * **Instances:** the module styles the sources and layers the map style already provides, so
     * every map has exactly one — a second `get()` returns the same instance, with the given
     * settings applied on top of what it already holds.
     *
     * @example
     * ```typescript
     * const styling = await StylingModule.get(map, { 'labels.sizeFactor': 1.2 });
     * ```
     */
    static async get(map: TomTomMap, settings?: StylingSettings): Promise<StylingModule> {
        await waitUntilMapIsReady(map);
        return sharedInstance(
            map,
            StylingModule,
            () => new StylingModule(map, settings),
            settings && ((existing) => existing.updateConfig(settings)),
        );
    }

    private constructor(map: TomTomMap, settings?: StylingSettings) {
        super(map, settings);
    }

    /**
     * @ignore
     */
    protected styleChangePriority(): number {
        // After the data and visibility modules have restored themselves, so knobs land on top.
        return 100;
    }

    /**
     * @ignore
     */
    protected _initSourcesWithLayers(): Record<string, never> {
        this.indexStyle(this.mapLibreMap.getStyle());
        // The one knob that has to be applied whether or not it was set: nothing else paints behind
        // the canvas, so leaving it alone shows the page through a globe. Runs on every style load,
        // which is what makes it follow a light/dark switch.
        this.refreshSpace(this.config ?? {});
        return {};
    }

    /**
     * @ignore
     */
    protected _applyConfig(settings: StylingSettings | undefined) {
        const next = withoutUndefined(settings);
        const ids = new Set<StylingKnobId>([...knobIdsIn(this.config), ...knobIdsIn(next)]);
        // Only the knobs whose value moved, or dragging one picker with a palette set re-derives all
        // ten per frame. A freshly indexed style is the exception: every knob has to land again.
        const touched = this.reindexed ? ids : [...ids].filter((id) => this.config?.[id] !== next[id]);
        this.reindexed = false;
        for (const id of touched) {
            this.refreshKnob(id, next);
        }
        // Raw layer overrides land on top of the knobs, as they did when they were made.
        if (this.tomtomMap.mapReady) this.layerOverrides.reapply();

        return Object.keys(next).length ? next : undefined;
    }

    /**
     * @ignore
     */
    protected discardShownData(): void {
        // A clean style switch drops the raw layer edits along with the settings.
        this.layerOverrides.clear();
    }

    /**
     * The advanced tier: raw MapLibre paint, layout and filter edits over a query of style layers,
     * re-applied across style switches. Version-coupled by nature — see {@link LayerSelection} for
     * the terms — so prefer a knob or {@link setMapColors} wherever one covers the intent.
     *
     * @example
     * ```typescript
     * styling.layers.query({ group: 'roadLabels' }).setPaint({ 'text-color': '#93c5fd' });
     * ```
     */
    get layers(): { query: (query: LayerQuery) => LayerSelection } {
        return { query: (query) => new LayerSelection(this.layerOverrides, query) };
    }

    /**
     * The styling catalogue for the loaded style: every knob with its kind, range, default, current
     * value and how many layers it reaches.
     *
     * @remarks
     * Meant to be consumed as data — build a control panel from it, hand it to an agent, or diff two
     * calls. Knob ids and the shape of the entries are public API and change additively only.
     *
     * @example
     * ```typescript
     * const { knobs } = styling.describe();
     * const sliders = knobs.filter((knob) => knob.kind === 'factor' && knob.available);
     * ```
     */
    describe(): StylingCatalogue {
        return {
            knobs: stylingKnobIds.map((id) => this.describeKnob(id)),
            presets: stylingPresetIds.map(
                (id): StylingPresetDescriptor => ({
                    id,
                    ...stylingPresets[id],
                    settings: { ...stylingPresets[id].settings },
                }),
            ),
        };
    }

    /**
     * Applies a preset: a named bundle of knob settings the SDK ships for a common intent
     * (`data-viz`, `night-driving`, `minimal`, `globe`). See `describe().presets` for
     * what each one sets.
     *
     * @param id - The preset to apply.
     * @param options - `merge: true` lays the preset over the current settings instead of replacing
     * them (the default), so knobs the preset does not mention keep their values.
     * @throws `Error` for an unknown preset id.
     *
     * @example
     * ```typescript
     * styling.applyPreset('data-viz');
     * styling.set('labels.sizeFactor', 1.1); // then adjust
     *
     * styling.applyPreset('globe', { merge: true }); // keep the rest, switch to a globe with a sky
     * ```
     */
    applyPreset(id: StylingPresetId, options: { merge?: boolean } = {}): void {
        const preset = stylingPresets[id];
        if (!preset) {
            throw new Error(`Unknown styling preset '${id}'. Known presets: ${stylingPresetIds.join(', ')}.`);
        }
        if (options.merge) this.updateConfig(preset.settings);
        else this.applyConfig({ ...preset.settings });
    }

    /**
     * The value a knob currently has: the override if one is set, otherwise the style's own default.
     *
     * @param id - The knob to read.
     * @returns The current value, or `undefined` when the style defines it as a data-driven
     * expression that no single value stands for.
     *
     * @example
     * ```typescript
     * styling.get('labels.sizeFactor'); // 1 until set
     * ```
     */
    get<ID extends StylingKnobId>(id: ID): StylingKnobValueOf<ID> | undefined {
        this.assertKnob(id);
        const override = this.config?.[id];
        return (override ?? this.defaultOf(id)) as StylingKnobValueOf<ID> | undefined;
    }

    /**
     * Sets one knob. The value is validated against the knob's kind and range before anything is
     * touched, and applied to every layer the knob reaches.
     *
     * @param id - The knob to set; see {@link describe} for the catalogue.
     * @param value - A number for `factor`/`number` knobs (within `range`), a boolean for `toggle`
     * knobs, a CSS colour string for `color` knobs.
     * @throws `RangeError` when the value is not valid for the knob; `Error` for an unknown id.
     *
     * @example
     * ```typescript
     * styling.set('roads.widthFactor', 1.3);
     * styling.set('buildings.3d', true);
     * styling.set('traffic.flow.stationaryColor', 'hsl(0, 100%, 40%)');
     * ```
     */
    set<ID extends StylingKnobId>(id: ID, value: StylingKnobValueOf<ID>): void {
        this.assertKnob(id);
        this.validate(id, value);
        this.config = { ...this.config, [id]: value };
        this.refreshKnob(id, this.config);
        this.emitConfigChange();
    }

    /**
     * Restores the style's own values for one knob, or for all of them.
     *
     * @param id - The knob to reset; omit to reset every knob (same as {@link resetConfig}).
     *
     * @example
     * ```typescript
     * styling.reset('labels.sizeFactor');
     * styling.reset(); // back to the style as shipped
     * ```
     */
    reset(id?: StylingKnobId): void {
        if (id === undefined) {
            this.resetConfig();
            return;
        }
        this.assertKnob(id);
        const { [id]: _removed, ...rest } = this.config ?? {};
        this.config = Object.keys(rest).length ? rest : undefined;
        this.refreshKnob(id, this.config ?? {});
        this.emitConfigChange();
    }

    /**
     * Recolours the whole base map with up to ten semantic colours in one call — Map Maker's
     * Foundations palette, each listed with what it reaches under {@link MapColorName}. Partial
     * objects are fine; colours not given stay as they are.
     *
     * @remarks
     * Each colour re-derives every shade the style built from it — a trunk variant, an outline, a
     * tunnel — at the style's own HSL offset, so those relationships survive the recolour. The ten
     * are also the `colors.*` knobs, so `describe()`, `reset` and settings persistence apply.
     *
     * Those offsets come off the loaded style, which makes a palette a recolour and not an
     * inversion: dark land over `standardLight` pushes the derived shades to the ends of their
     * range, so switch to `standardDark` first.
     *
     * @param colors - The colours to set, as CSS colour strings.
     * @throws `RangeError` for a value that is not a colour; `Error` for an unknown colour name.
     *
     * @example
     * ```typescript
     * styling.setMapColors({ land: '#f3f5f7', water: '#accbe2', roadMajor: '#a1b8ce', label: '#364659' });
     * styling.reset('colors.roadMajor'); // one colour back to the style
     * ```
     */
    setMapColors(colors: MapColors): void {
        const settings: Partial<Record<MapColorKnobId, string>> = {};
        for (const [name, value] of Object.entries(colors)) {
            if (!isMapColorName(name)) {
                throw new Error(`Unknown map colour '${name}'. Known colours: ${mapColorNames.join(', ')}.`);
            }
            if (value === undefined) continue;

            const id = mapColorKnobId(name);
            this.validate(id, value);
            settings[id] = value;
        }
        this.updateConfig(settings);
    }

    /**
     * The style as currently rendered — the loaded style with every knob applied — as a MapLibre
     * style specification, to save, diff, serve yourself, or load back as a custom style.
     *
     * @remarks
     * It includes whatever the SDK's data modules (places, routes) have on the map, and its tile
     * URLs carry the API key the map was created with: strip or rotate it before publishing.
     */
    exportStyle(): StyleSpecification {
        return structuredClone(this.mapLibreMap.getStyle());
    }

    /**
     * Lifecycle events of this module. The module owns no map features, so there are no user
     * interaction events; `config-change` fires with the full settings after every knob change.
     *
     * @example
     * ```typescript
     * styling.events.on('config-change', (settings) => localStorage.setItem('styling', JSON.stringify(settings)));
     * ```
     */
    get events(): StylingEvents {
        return this.moduleEvents([]);
    }

    // ── Indexing the loaded style ─────────────────────────────────────────────────────────────

    private indexStyle(style: StyleSpecification | undefined): void {
        const layers = style?.layers ?? [];
        this.originalValues = new Map();
        this.styleSources = style?.sources ?? {};
        this.resolved = new Map();
        this.scaleKnobsByTarget = new Map();
        this.mapColorTargetsByKey = new Map();
        this.mapColorTargetsByKnob = new Map();
        this.mapColorAnchors = new Map();
        this.warned = new Set();
        this.reindexed = true;
        this.layerOverrides ??= new LayerOverrides(this.mapLibreMap, this.filterComposer, (key, message) =>
            this.warnOnce(key, message),
        );
        this.layerOverrides.index(layers, this.styleSources);
        this.mapLevelState = {
            projection: style?.projection?.type ?? 'mercator',
            sky: style?.sky,
        };

        for (const id of stylingKnobIds) {
            const definition: KnobDefinition = knobDefinitions[id];
            const mechanisms = definition.mechanisms.map((mechanism) => this.resolveMechanism(id, mechanism, layers));
            const targets = new Set(mechanisms.flatMap((resolvedMechanism) => resolvedMechanism.layerIds)).size;
            this.resolved.set(id, { definition, mechanisms, targets });
            if (targets === 0) {
                this.warnOnce(
                    id,
                    `knob '${id}' matches no layer in the loaded style (curated for style version ${DEFAULT_STYLE_VERSION}); it will have no effect.`,
                );
            }
        }
    }

    private resolveMechanism(
        id: StylingKnobId,
        mechanism: KnobMechanism,
        layers: LayerSpecification[],
    ): ResolvedMechanism {
        if (mechanism.type === 'mapColor') {
            return { mechanism, layerIds: this.resolveMapColor(mechanism.color, layers), shadeLayerIds: [] };
        }
        if (!('layers' in mechanism)) {
            return { mechanism, layerIds: [MAP_LEVEL], shadeLayerIds: [] };
        }

        const matched = layers.filter((layer) => matchesAnyLayerSelector(mechanism.layers, layer, this.styleSources));
        let layerIds: string[];
        let shadeLayerIds: string[] = [];
        switch (mechanism.type) {
            case 'scale':
                layerIds = matched.filter((layer) => this.capture(layer, mechanism.property)).map((layer) => layer.id);
                for (const layerId of layerIds) {
                    const key = targetKey(layerId, mechanism.property);
                    this.scaleKnobsByTarget.set(key, [...(this.scaleKnobsByTarget.get(key) ?? []), id]);
                }
                break;
            case 'color': {
                layerIds = matched.filter((layer) => this.capture(layer, mechanism.property)).map((layer) => layer.id);
                const shadeSelectors = mechanism.shades ?? [];
                const shades = layers.filter((layer) =>
                    matchesAnyLayerSelector(shadeSelectors, layer, this.styleSources),
                );
                shadeLayerIds = shades
                    .filter((layer) => this.capture(layer, mechanism.property))
                    .map((layer) => layer.id);
                break;
            }
            case 'visibility':
                layerIds = matched.filter((layer) => this.capture(layer, 'visibility')).map((layer) => layer.id);
                break;
            case 'minZoom':
            case 'maxZoom':
                layerIds = matched.map((layer) => layer.id);
                for (const layer of matched) {
                    this.capture(layer, 'minzoom');
                    this.capture(layer, 'maxzoom');
                }
                break;
            case 'paintLiteral':
                // A layer without the property still takes it (the style relies on the spec default).
                layerIds = matched.map((layer) => layer.id);
                for (const layer of matched) this.capture(layer, mechanism.property);
                break;
            case 'zoomOffset':
                layerIds = matched
                    .filter((layer) => shiftZoomOffset(layerFilterOf(layer), 0).patched)
                    .map((layer) => layer.id);
                break;
        }
        return { mechanism, layerIds, shadeLayerIds };
    }

    // Records the style's own value of a layer property; false when the layer has no such property
    // (a symbol layer without text has no text size to scale).
    private capture(layer: LayerSpecification, property: LayerProperty): boolean {
        const value = styleValueOf(layer, property);
        if (value === undefined) return false;

        this.originalValues.set(targetKey(layer.id, property), value);
        return true;
    }

    // The captured value keeps the type its property promises, so callers of the zoom keys get a
    // number without asserting: `capture` only ever stores what `styleValueOf` read off the layer.
    private originalValueOf<PROPERTY extends LayerProperty>(
        layerId: string,
        property: PROPERTY,
    ): LayerPropertyValue<PROPERTY> | undefined {
        return this.originalValues.get(targetKey(layerId, property)) as LayerPropertyValue<PROPERTY> | undefined;
    }

    // Indexes one semantic colour: the (layer, property) pairs it rewrites with the ownership rule
    // for each, and the anchor its shades are measured from. A layer reached by several targets — a
    // tunnel drawing every road class — is registered once per rule.
    private resolveMapColor(color: MapColorName, layers: LayerSpecification[]): string[] {
        const knobId = mapColorKnobId(color);
        const definition = mapColorDefinitions[color];
        const instances: MapColorTargetInstance[] = [];
        for (const target of definition.targets) {
            for (const layer of layers.filter((candidate) =>
                matchesAnyLayerSelector(target.layers, candidate, this.styleSources),
            )) {
                for (const property of target.properties) {
                    if (!this.capture(layer, property)) continue;

                    const instance = { knobId, layerId: layer.id, property, owns: ownershipOf(target) };
                    instances.push(instance);
                    const key = targetKey(layer.id, property);
                    this.mapColorTargetsByKey.set(key, [...(this.mapColorTargetsByKey.get(key) ?? []), instance]);
                }
            }
        }
        this.mapColorTargetsByKnob.set(knobId, instances);

        const { anchor } = definition;
        const anchorLayer = layers.find(
            (candidate) =>
                matchesAnyLayerSelector(anchor.layers, candidate, this.styleSources) &&
                styleValueOf(candidate, anchor.property) !== undefined,
        );
        const literal =
            anchorLayer &&
            pickAnchorLiteral(styleValueOf(anchorLayer, anchor.property), ownershipOf({ roadClass: anchor.roadClass }));
        if (literal) this.mapColorAnchors.set(knobId, literal);

        // Without an anchor there is nothing to measure shades from: the colour is unreachable.
        return literal ? [...new Set(instances.map((instance) => instance.layerId))] : [];
    }

    // ── Applying knobs ────────────────────────────────────────────────────────────────────────

    // Brings every layer the knob reaches in line with `settings`: the knob's value when set, the
    // style's own value otherwise.
    private refreshKnob(id: StylingKnobId, settings: StylingSettings): void {
        const resolvedKnob = this.resolved.get(id);
        if (!resolvedKnob || !this.tomtomMap.mapReady) return;

        for (const resolvedMechanism of resolvedKnob.mechanisms) {
            this.refreshMechanism(id, resolvedMechanism, settings);
        }
    }

    // One mechanism of one knob: the map-level and multi-layer ones here, the rest layer by layer.
    private refreshMechanism(
        id: StylingKnobId,
        { mechanism, layerIds, shadeLayerIds }: ResolvedMechanism,
        settings: StylingSettings,
    ): void {
        switch (mechanism.type) {
            case 'color':
                this.refreshColor(mechanism.property, layerIds, shadeLayerIds, settings[id] as string | undefined);
                break;
            case 'projection':
                this.refreshProjection(settings);
                break;
            case 'sky':
                this.refreshSky(settings);
                break;
            case 'space':
                this.refreshSpace(settings);
                break;
            case 'mapColor':
                for (const { layerId, property } of this.mapColorTargetsByKnob.get(id) ?? []) {
                    this.refreshMapColorProperty(layerId, property, settings);
                }
                break;
            default:
                for (const layerId of layerIds) this.refreshLayer(mechanism, layerId, settings[id], settings);
        }
    }

    private refreshLayer(
        mechanism: LayerByLayerMechanism,
        layerId: string,
        value: StylingKnobValue | undefined,
        settings: StylingSettings,
    ): void {
        switch (mechanism.type) {
            case 'scale':
                this.refreshScaledProperty(layerId, mechanism.property, settings);
                break;
            case 'visibility':
                this.refreshVisibility(layerId, value as boolean | undefined);
                break;
            case 'minZoom':
            case 'maxZoom':
                this.refreshZoomBound(layerId, ZOOM_BOUNDS[mechanism.type], value as number | undefined);
                break;
            case 'paintLiteral':
                this.setProperty(
                    layerId,
                    mechanism.property,
                    value ?? this.originalValueOf(layerId, mechanism.property),
                );
                break;
            case 'zoomOffset':
                this.refreshZoomOffset(layerId, value as number | undefined);
                break;
        }
    }

    // The canvas is transparent wherever the map does not reach — around a globe, and behind a
    // tilted flat map — so this paints the container the canvas sits on. Re-applied after a style
    // change like every other knob, which is what keeps it following a light/dark switch.
    private refreshSpace(settings: StylingSettings): void {
        const container = this.mapLibreMap.getContainer();
        this.originalSpaceColor ??= paintedBackgroundOf(container);
        container.style.backgroundColor = settings['view.spaceColor'] ?? this.defaultSpaceColor();
    }

    // The page's own background where it painted one, so the knob gives it back on a reset instead
    // of the SDK keeping a colour the page never asked for; the theme's otherwise, since then
    // nothing at all paints behind the canvas.
    private defaultSpaceColor(): string {
        return this.originalSpaceColor || SPACE_COLOR_DEFAULTS[this.tomtomMap.styleLightDarkTheme];
    }

    // Re-derives one (layer, property) from the style's own value through every map-colour knob that
    // reaches it. The knobs bid together rather than in turn, so each judges the literals the style
    // shipped instead of what the previous knob left behind.
    private refreshMapColorProperty(layerId: string, property: PaintColorProperty, settings: StylingSettings): void {
        const originalValue = this.originalValueOf(layerId, property);
        const bids: MapColorBid[] = [];
        for (const { knobId, owns } of this.mapColorTargetsByKey.get(targetKey(layerId, property)) ?? []) {
            const newColor = settings[knobId];
            const anchorColor = this.mapColorAnchors.get(knobId);
            if (typeof newColor !== 'string' || !anchorColor) continue;

            bids.push({ anchorColor, newColor, owns });
        }
        this.setProperty(layerId, property, bids.length ? recolorValue(originalValue, bids) : originalValue);
    }

    private refreshProjection(settings: StylingSettings): void {
        // Validated against the knob's `options` before it was stored, so it is one of MapLibre's
        // projection names — which the knob's value type, a plain string, cannot promise.
        const wanted = settings['view.projection'] as ProjectionValue | undefined;
        this.mapLibreMap.setProjection({ type: wanted ?? this.mapLevelState.projection });
    }

    // The sky is one MapLibre setting driven by three knobs: on/off and its two colours. The style's
    // own sky wins over our defaults, and those follow the style's light/dark theme. Off means no
    // sky, including over a style that ships one.
    private refreshSky(settings: StylingSettings): void {
        const styleSky = this.mapLevelState.sky;
        const wanted = settings['view.sky'] ?? this.defaultOf('view.sky');
        const themeSky = SKY_DEFAULTS[this.tomtomMap.styleLightDarkTheme];
        const sky: SkySpecification = wanted
            ? {
                  ...themeSky,
                  ...styleSky,
                  'sky-color': settings['view.skyColor'] ?? styleSky?.['sky-color'] ?? themeSky['sky-color'],
                  'horizon-color':
                      settings['view.horizonColor'] ?? styleSky?.['horizon-color'] ?? themeSky['horizon-color'],
              }
            : CLEAR_SKY;
        this.mapLibreMap.setSky(sky, { validate: false });
    }

    private refreshVisibility(layerId: string, visible: boolean | undefined): void {
        if (visible === undefined) {
            this.setProperty(layerId, 'visibility', this.originalValueOf(layerId, 'visibility'));
            return;
        }

        this.setProperty(layerId, 'visibility', visible ? 'visible' : 'none');
    }

    // Sets one end of the layer's zoom range, or restores it; the other end stays as the style has it.
    private refreshZoomBound(layerId: string, bound: ZoomProperty, value: number | undefined): void {
        if (!this.mapLibreMap.getLayer(layerId)) return;

        const range = {
            minzoom: this.styleZoomBound(layerId, 'minzoom'),
            maxzoom: this.styleZoomBound(layerId, 'maxzoom'),
        };
        range[bound] = value ?? range[bound];
        this.mapLibreMap.setLayerZoomRange(layerId, range.minzoom, range.maxzoom);
    }

    private styleZoomBound(layerId: string, bound: ZoomProperty): number {
        return this.originalValueOf(layerId, bound) ?? SPEC_DEFAULTS[bound];
    }

    private refreshZoomOffset(layerId: string, shift: number | undefined): void {
        this.filterComposer.setTransform(
            layerId,
            ZOOM_SHIFT_CONTRIBUTOR,
            shift === undefined ? undefined : (filter) => shiftZoomOffset(filter, shift).filter,
        );
    }

    private refreshScaledProperty(layerId: string, property: ScalableProperty, settings: StylingSettings): void {
        const original = this.originalValueOf(layerId, property);
        const factor = (this.scaleKnobsByTarget.get(targetKey(layerId, property)) ?? []).reduce(
            (product, knobId) => product * ((settings[knobId] as number | undefined) ?? 1),
            1,
        );
        if (factor === 1) {
            this.setProperty(layerId, property, original);
            return;
        }
        const scaled = scaleNumericValue(original, factor);
        if (scaled === undefined) {
            this.warnOnce(
                `scale:${layerId}:${property}`,
                `cannot scale '${property}' of layer '${layerId}': the style gives it a value this knob cannot scale (a non-numeric value, or an expression holding a nested zoom term); leaving it as the style defines it.`,
            );
            return;
        }
        this.setProperty(layerId, property, scaled);
    }

    private refreshColor(
        property: ColorProperty,
        layerIds: string[],
        shadeLayerIds: string[],
        value: string | undefined,
    ): void {
        for (const layerId of layerIds) {
            this.setProperty(layerId, property, value ?? this.originalValueOf(layerId, property));
        }
        // The style derived the shade layers' colours from the primary one; re-derive them from the
        // new colour with the same HSL offset, so an outline stays the darker rim it was designed as.
        const primaryOriginal = layerIds.map((layerId) => this.originalValueOf(layerId, property)).find(isColorLiteral);
        for (const layerId of shadeLayerIds) {
            const shadeOriginal = this.originalValueOf(layerId, property);
            let shaded: unknown = shadeOriginal;
            if (value !== undefined) {
                const shift =
                    isColorLiteral(shadeOriginal) && primaryOriginal && hslShiftBetween(primaryOriginal, shadeOriginal);
                shaded = (shift && shiftHsl(value, shift)) ?? value;
            }
            this.setProperty(layerId, property, shaded);
        }
    }

    private setProperty(layerId: string, property: LayerProperty, value: unknown): void {
        if (!this.mapLibreMap.getLayer(layerId)) return;

        const writer: RuntimeLayerProperties = this.mapLibreMap;
        if (LAYOUT_PROPERTIES.has(property)) {
            writer.setLayoutProperty(layerId, property, value, { validate: false });
        } else if (PAINT_PROPERTIES.has(property)) {
            writer.setPaintProperty(layerId, property, value, { validate: false });
        }
    }

    // ── Catalogue ─────────────────────────────────────────────────────────────────────────────

    private describeKnob(id: StylingKnobId): StylingKnobDescriptor {
        const resolvedKnob = this.resolved.get(id);
        const definition: KnobDefinition = resolvedKnob?.definition ?? knobDefinitions[id];
        const targets = resolvedKnob?.targets ?? 0;
        return knob(id, definition.kind, definition.description, this.defaultOf(id), this.config?.[id], {
            ...(definition.range && { range: definition.range }),
            ...(definition.options && { options: definition.options }),
            available: targets > 0,
            appliesTo: definition.appliesTo,
        });
    }

    // What the loaded style ships for a knob: 1 for factors, the first target's literal for colours
    // and zooms, the first target's visibility for toggles; undefined when no single value stands
    // for a data-driven expression.
    private defaultOf(id: StylingKnobId): StylingKnobValue | undefined {
        const resolvedKnob = this.resolved.get(id);
        if (!resolvedKnob) return undefined;

        const { definition, mechanisms } = resolvedKnob;
        if (definition.kind === 'factor') return 1;

        const [first] = mechanisms;
        const [layerId] = first?.layerIds ?? [];
        if (layerId === undefined) return undefined;

        if (first.mechanism.type === 'mapColor') return this.mapColorAnchors.get(id);
        if (!('layers' in first.mechanism)) return this.mapLevelDefaultOf(id);

        switch (first.mechanism.type) {
            case 'visibility':
                return this.originalValueOf(layerId, 'visibility') !== 'none';
            case 'color': {
                const original = this.originalValueOf(layerId, first.mechanism.property);
                return isColorLiteral(original) ? original : undefined;
            }
            case 'minZoom':
            case 'maxZoom':
                return this.styleZoomBound(layerId, ZOOM_BOUNDS[first.mechanism.type]);
            case 'paintLiteral': {
                const original = this.originalValueOf(layerId, first.mechanism.property);
                return typeof original === 'string' || typeof original === 'number' ? original : undefined;
            }
            case 'zoomOffset':
                return 0;
            default:
                return undefined;
        }
    }

    // What the loaded style declares for the view knobs.
    private mapLevelDefaultOf(id: StylingKnobId): StylingKnobValue | undefined {
        const { projection, sky } = this.mapLevelState;
        switch (id) {
            case 'view.projection':
                // A style that drives its projection from an expression has no one value to report.
                return typeof projection === 'string' ? projection : undefined;
            case 'view.sky':
                // A style without a sky, or with a fully transparent one, shows none.
                return sky !== undefined && sky['atmosphere-blend'] !== 0 && sky['sky-color'] !== 'transparent';
            case 'view.skyColor':
                return isColorLiteral(sky?.['sky-color'])
                    ? sky['sky-color']
                    : SKY_DEFAULTS[this.tomtomMap.styleLightDarkTheme]['sky-color'];
            case 'view.horizonColor':
                return isColorLiteral(sky?.['horizon-color'])
                    ? sky['horizon-color']
                    : SKY_DEFAULTS[this.tomtomMap.styleLightDarkTheme]['horizon-color'];
            case 'view.spaceColor':
                return this.defaultSpaceColor();
            default:
                return undefined;
        }
    }

    // ── Validation ────────────────────────────────────────────────────────────────────────────

    private assertKnob(id: string): asserts id is StylingKnobId {
        if (!(id in knobDefinitions)) {
            throw new Error(`Unknown styling knob '${id}'. Call describe() for the catalogue of knob ids.`);
        }
    }

    private validate(id: StylingKnobId, value: unknown): void {
        const { kind, range, options }: KnobDefinition = knobDefinitions[id];
        switch (kind) {
            case 'toggle':
                if (typeof value !== 'boolean')
                    throw new RangeError(`Knob '${id}' expects true or false; got ${describe(value)}.`);
                break;
            case 'enum':
                if (typeof value !== 'string' || !options?.includes(value)) {
                    throw new RangeError(`Knob '${id}' expects one of ${options?.join(', ')}; got ${describe(value)}.`);
                }
                break;
            case 'color':
                if (!isColorLiteral(value)) {
                    throw new RangeError(
                        `Knob '${id}' expects a CSS colour (#rrggbb, hsl(), rgb() or a named colour); got ${describe(value)}.`,
                    );
                }
                break;
            default:
                if (typeof value !== 'number' || !Number.isFinite(value)) {
                    throw new RangeError(`Knob '${id}' expects a number; got ${describe(value)}.`);
                }
                if (range && (value < range.min || value > range.max)) {
                    throw new RangeError(
                        `Knob '${id}' expects a number between ${range.min} and ${range.max}; got ${value}.`,
                    );
                }
        }
    }

    private warnOnce(key: string, message: string): void {
        if (this.warned.has(key)) return;

        this.warned.add(key);
        console.warn(`[StylingModule] ${message}`);
    }
}

const mapColorKnobId = (name: MapColorName): MapColorKnobId => `colors.${name}`;

// Which literals a map-colour target owns: all of them, or only those on one side of the major/minor
// road split — where "minor" also takes the literals outside any road-class match.
const ownershipOf = (target: Pick<MapColorTarget, 'roadClass'>): LiteralOwnership => {
    if (target.roadClass === 'major') return (roadClass) => roadClass === 'major';
    if (target.roadClass === 'minor') return (roadClass) => roadClass !== 'major';
    return () => true;
};

const describe = (value: unknown): string => (typeof value === 'string' ? `'${value}'` : String(value));

const knobIdsIn = (settings: StylingSettings | undefined): StylingKnobId[] =>
    Object.keys(settings ?? {}).filter((key): key is StylingKnobId => key in knobDefinitions);

// Settings without `undefined` entries (an explicit `undefined` means "not set", like an absent key).
const withoutUndefined = (settings: StylingSettings | undefined): StylingSettings =>
    Object.fromEntries(Object.entries(settings ?? {}).filter(([, value]) => value !== undefined)) as StylingSettings;

// What the page paints behind the map container, empty when it paints nothing. Computed rather than
// inline, since a background a stylesheet sets never reaches `style`.
const paintedBackgroundOf = (container: HTMLElement): string => {
    const painted = getComputedStyle(container).backgroundColor;
    return UNPAINTED_BACKGROUNDS.has(painted) ? '' : painted;
};

const layerFilterOf = (layer: LayerSpecification): unknown => ('filter' in layer ? layer.filter : undefined);

// The value a layer property has in the loaded style, falling back to the spec default where the
// layer relies on it; undefined when the layer has no such property at all.
const styleValueOf = (layer: LayerSpecification, property: LayerProperty): unknown => {
    const layout = ('layout' in layer ? layer.layout : undefined) as Record<string, unknown> | undefined;
    const paint = ('paint' in layer ? layer.paint : undefined) as Record<string, unknown> | undefined;
    switch (property) {
        case 'text-size':
            return layer.type === 'symbol' && layout?.['text-field'] !== undefined
                ? (layout['text-size'] ?? SPEC_DEFAULTS['text-size'])
                : undefined;
        case 'icon-size':
            return layer.type === 'symbol' && layout?.['icon-image'] !== undefined
                ? (layout['icon-size'] ?? SPEC_DEFAULTS['icon-size'])
                : undefined;
        case 'line-width':
            return layer.type === 'line' ? (paint?.['line-width'] ?? SPEC_DEFAULTS['line-width']) : undefined;
        case 'visibility':
            return layout?.visibility ?? SPEC_DEFAULTS.visibility;
        case 'minzoom':
            return layer.minzoom;
        case 'maxzoom':
            return layer.maxzoom;
        default:
            return paintValueOf(layer, property, paint);
    }
};

// Hillshade layers lean on the spec defaults for whatever paint they leave unset.
const paintValueOf = (layer: LayerSpecification, property: LayerProperty, paint?: Record<string, unknown>): unknown =>
    paint?.[property] ?? (layer.type === 'hillshade' && hasSpecDefault(property) ? SPEC_DEFAULTS[property] : undefined);
