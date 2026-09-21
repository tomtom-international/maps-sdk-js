import type { LayerSpecification, MapGeoJSONFeature, SourceSpecification, StyleSetterOptions } from 'maplibre-gl';
import { DEFAULT_STYLE_VERSION } from '../init';
import { AbstractStyleOwnedMapModule, type CombinedEvents, knob, sharedInstance } from '../shared';
import { matchesAnyLayerSelector } from '../shared/layers/layerSelector';
import { waitUntilMapIsReady } from '../shared/mapUtils';
import type { TomTomMap } from '../TomTomMap';
import { hslShiftBetween, shiftHsl, toHsl } from '../utils/colorUtils';
import { scaleNumericValue, shiftZoomOffset } from './expressionTransforms';
import {
    type ColorProperty,
    type KnobDefinition,
    type KnobMechanism,
    knobDefinitions,
    type ScalableProperty,
    type StylingKnobId,
    type StylingKnobValueOf,
    stylingKnobIds,
} from './knobCatalogue';
import type { StylingCatalogue, StylingKnobDescriptor, StylingKnobValue, StylingSettings } from './types/stylingTypes';

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
type LayerProperty = ScalableProperty | ColorProperty | 'visibility' | 'minzoom' | 'maxzoom';

// MapLibre types each setter's value against the literal property name it is given, and neither
// setter's name parameter accepts `LayerProperty`'s zoom keys at all — a pairing a name picked at
// runtime cannot express. The knobs write through this view of the same two setters, carrying values
// that are either the style's own or an expression wrapped around them.
type RuntimePropertyWriter = {
    setLayoutProperty(layerId: string, property: string, value: unknown, options: StyleSetterOptions): unknown;
    setPaintProperty(layerId: string, property: string, value: unknown, options: StyleSetterOptions): unknown;
};

// A layer's zoom range is always a number in the style spec, while every other property can hold an
// expression the knobs pass through untouched — so those stay `unknown` and only the zoom keys carry
// a value type worth promising.
type ZoomProperty = 'minzoom' | 'maxzoom';
type LayerPropertyValue<PROPERTY extends LayerProperty> = PROPERTY extends ZoomProperty ? number : unknown;

// This module's key with the filter composer — one per mechanism that writes a filter.
const ZOOM_SHIFT_CONTRIBUTOR = 'styling.zoomShift';

const LAYOUT_PROPERTIES: ReadonlySet<LayerProperty> = new Set(['text-size', 'icon-size', 'visibility']);
const PAINT_PROPERTIES: ReadonlySet<LayerProperty> = new Set([
    'line-width',
    'line-color',
    'text-color',
    'text-halo-color',
]);

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
} satisfies { [PROPERTY in LayerProperty]?: LayerPropertyValue<PROPERTY> };

// Which layers a mechanism reaches in the loaded style.
type ResolvedMechanism = { mechanism: KnobMechanism; layerIds: string[]; shadeLayerIds: string[] };
type ResolvedKnob = { definition: KnobDefinition; mechanisms: ResolvedMechanism[]; targets: number };

const targetKey = (layerId: string, property: LayerProperty) => `${layerId}|${property}`;

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
    private styleSources!: Record<string, SourceSpecification>;
    private resolved!: Map<StylingKnobId, ResolvedKnob>;
    // Scale knobs compose: a (layer, property) reached by several of them gets their product.
    private scaleKnobsByTarget!: Map<string, StylingKnobId[]>;
    private warned!: Set<string>;

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
            settings && ((existing) => existing.applyConfig({ ...existing.config, ...settings })),
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
        const style = this.mapLibreMap.getStyle();
        this.indexStyle(style?.layers ?? [], style?.sources ?? {});
        return {};
    }

    /**
     * @ignore
     */
    protected _applyConfig(settings: StylingSettings | undefined) {
        const next = withoutUndefined(settings);
        const touched = new Set<StylingKnobId>([...knobIdsIn(this.config), ...knobIdsIn(next)]);
        for (const id of touched) {
            this.refreshKnob(id, next);
        }
        return Object.keys(next).length ? next : undefined;
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
        };
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

    private indexStyle(layers: LayerSpecification[], sources: Record<string, SourceSpecification>): void {
        this.originalValues = new Map();
        this.styleSources = sources;
        this.resolved = new Map();
        this.scaleKnobsByTarget = new Map();
        this.warned = new Set();

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
                layerIds = matched.map((layer) => layer.id);
                for (const layer of matched) {
                    this.capture(layer, 'minzoom');
                    this.capture(layer, 'maxzoom');
                }
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

    // ── Applying knobs ────────────────────────────────────────────────────────────────────────

    // Brings every layer the knob reaches in line with `settings`: the knob's value when set, the
    // style's own value otherwise.
    private refreshKnob(id: StylingKnobId, settings: StylingSettings): void {
        const resolvedKnob = this.resolved.get(id);
        if (!resolvedKnob || !this.tomtomMap.mapReady) return;

        for (const resolvedMechanism of resolvedKnob.mechanisms) {
            this.refreshMechanism(resolvedMechanism, settings[id], settings);
        }
    }

    // One mechanism of one knob: every mechanism type reaches its layers its own way.
    private refreshMechanism(
        { mechanism, layerIds, shadeLayerIds }: ResolvedMechanism,
        value: StylingKnobValue | undefined,
        settings: StylingSettings,
    ): void {
        switch (mechanism.type) {
            case 'scale':
                for (const layerId of layerIds) this.refreshScaledProperty(layerId, mechanism.property, settings);
                break;
            case 'visibility':
                for (const layerId of layerIds) this.refreshVisibility(layerId, value as boolean | undefined);
                break;
            case 'color':
                this.refreshColor(mechanism.property, layerIds, shadeLayerIds, value as string | undefined);
                break;
            case 'minZoom':
                for (const layerId of layerIds) this.refreshMinZoom(layerId, value as number | undefined);
                break;
            case 'zoomOffset':
                for (const layerId of layerIds) this.refreshZoomOffset(layerId, value as number | undefined);
                break;
        }
    }

    private refreshVisibility(layerId: string, visible: boolean | undefined): void {
        if (visible === undefined) {
            this.setProperty(layerId, 'visibility', this.originalValueOf(layerId, 'visibility'));
            return;
        }

        this.setProperty(layerId, 'visibility', visible ? 'visible' : 'none');
    }

    private refreshMinZoom(layerId: string, minZoom: number | undefined): void {
        if (!this.mapLibreMap.getLayer(layerId)) return;

        const minzoom = minZoom ?? this.originalValueOf(layerId, 'minzoom') ?? SPEC_DEFAULTS.minzoom;
        const maxzoom = this.originalValueOf(layerId, 'maxzoom') ?? SPEC_DEFAULTS.maxzoom;
        this.mapLibreMap.setLayerZoomRange(layerId, minzoom, maxzoom);
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

        const writer: RuntimePropertyWriter = this.mapLibreMap;
        if (LAYOUT_PROPERTIES.has(property)) {
            writer.setLayoutProperty(layerId, property, value, { validate: false });
        } else if (PAINT_PROPERTIES.has(property)) {
            writer.setPaintProperty(layerId, property, value, { validate: false });
        }
    }

    // ── Catalogue ─────────────────────────────────────────────────────────────────────────────

    private describeKnob(id: StylingKnobId): StylingKnobDescriptor {
        const { definition, targets } = this.resolved.get(id) ?? { definition: knobDefinitions[id], targets: 0 };
        return knob(id, definition.kind, definition.description, this.defaultOf(id), this.config?.[id], {
            ...(definition.range && { range: definition.range }),
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

        switch (first.mechanism.type) {
            case 'visibility':
                return this.originalValueOf(layerId, 'visibility') !== 'none';
            case 'color': {
                const original = this.originalValueOf(layerId, first.mechanism.property);
                return isColorLiteral(original) ? original : undefined;
            }
            case 'minZoom':
                return this.originalValueOf(layerId, 'minzoom') ?? SPEC_DEFAULTS.minzoom;
            case 'zoomOffset':
                return 0;
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
        const { kind, range } = knobDefinitions[id];
        switch (kind) {
            case 'toggle':
                if (typeof value !== 'boolean')
                    throw new RangeError(`Knob '${id}' expects true or false; got ${describe(value)}.`);
                break;
            case 'color':
                if (typeof value !== 'string' || !toHsl(value)) {
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

const isColorLiteral = (value: unknown): value is string => typeof value === 'string' && toHsl(value) !== undefined;

const describe = (value: unknown): string => (typeof value === 'string' ? `'${value}'` : String(value));

const knobIdsIn = (settings: StylingSettings | undefined): StylingKnobId[] =>
    Object.keys(settings ?? {}).filter((key): key is StylingKnobId => key in knobDefinitions);

// Settings without `undefined` entries (an explicit `undefined` means "not set", like an absent key).
const withoutUndefined = (settings: StylingSettings | undefined): StylingSettings =>
    Object.fromEntries(Object.entries(settings ?? {}).filter(([, value]) => value !== undefined)) as StylingSettings;

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
            return paint?.[property];
    }
};
