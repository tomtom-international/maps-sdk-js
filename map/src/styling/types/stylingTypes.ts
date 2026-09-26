import type { KnobDescriptor, KnobKind, KnobRange, MapModuleCommonConfig } from '../../shared';
import type { StylingKnobId, StylingKnobValueOf } from '../knobCatalogue';
import type { StylingPresetId } from '../presets';

/**
 * What kind of value a styling knob takes — a subset of the shared {@link KnobKind} vocabulary.
 *
 * - `factor`: a multiplier over what the style already does (`1` = unchanged), e.g. label size.
 * - `number`: an absolute number with a range, e.g. a minimum zoom.
 * - `toggle`: `true`/`false`, e.g. whether exit numbers are shown.
 * - `color`: a CSS colour string (`#rrggbb`, `hsl(…)`, `rgb(…)`, a named colour).
 * - `enum`: one of the knob's `options`, e.g. the projection.
 *
 * @group Map Styling
 */
export const stylingKnobKinds = ['factor', 'number', 'toggle', 'color', 'enum'] as const satisfies readonly KnobKind[];

/**
 * @group Map Styling
 */
export type StylingKnobKind = (typeof stylingKnobKinds)[number];

/**
 * Which styles a knob works on.
 *
 * - `any-style`: every style, including a custom one of your own.
 * - `tomtom-styles`: the TomTom styles this SDK version is verified against. On any other style the
 *   knob reports itself unavailable instead of doing nothing silently.
 *
 * @group Map Styling
 */
export const stylingKnobAppliesTo = ['any-style', 'tomtom-styles'] as const;

/**
 * @group Map Styling
 */
export type StylingKnobAppliesTo = (typeof stylingKnobAppliesTo)[number];

/**
 * A value a styling knob can hold; which one depends on the knob's {@link StylingKnobKind}.
 *
 * @group Map Styling
 */
export type StylingKnobValue = number | boolean | string;

/**
 * The valid range of a numeric knob, in the units of the knob (`factor` knobs are unitless).
 * Styling always ships a slider `step`; the shared {@link KnobRange} leaves it optional.
 *
 * @group Map Styling
 */
export type StylingKnobRange = KnobRange & { step: number };

/**
 * One entry of the styling catalogue returned by {@link StylingModule.describe}: everything a UI or
 * an agent needs to offer the knob, validate a value for it and show its state.
 *
 * @remarks
 * Narrows the shared {@link KnobDescriptor}: styling ids and value types are known, `range.step` is
 * always given, and `available` / `appliesTo` are required — every styling knob answers both.
 *
 * @group Map Styling
 */
export type StylingKnobDescriptor = KnobDescriptor & {
    /** The knob's id, as accepted by {@link StylingModule.set}. */
    id: StylingKnobId;
    kind: StylingKnobKind;
    /**
     * The value the loaded style ships with. `undefined` when the style defines it as a data-driven
     * expression that no single value stands for; `reset` still restores it exactly.
     */
    default: StylingKnobValue | undefined;
    /** The value in effect right now: the override if there is one, otherwise the default. */
    current: StylingKnobValue | undefined;
    /** The range of valid values, for `factor` and `number` knobs. */
    range?: StylingKnobRange;
    /** The valid values, for `enum` knobs. */
    options?: readonly string[];
    /**
     * Whether the knob has anything to work on in the loaded style. `false` means setting it would
     * do nothing, and the SDK also warns once in the console when that happens. Check this before
     * offering the knob in a UI or to an agent. Map-level knobs are always available.
     */
    available: boolean;
    /** Which styles the knob works on; see {@link stylingKnobAppliesTo}. */
    appliesTo: StylingKnobAppliesTo;
};

/**
 * The machine-readable styling catalogue: what can be styled on the loaded style, with defaults,
 * ranges and current values. Additive across SDK minor versions; knob ids are public API.
 *
 * @group Map Styling
 */
export type StylingCatalogue = {
    knobs: StylingKnobDescriptor[];
    /** The presets {@link StylingModule.applyPreset} accepts, with the settings each one applies. */
    presets: StylingPresetDescriptor[];
};

/**
 * A named bundle of knob settings — TomTom's cartographic opinions, in code. Apply one with
 * {@link StylingModule.applyPreset}.
 *
 * @group Map Styling
 */
export type StylingPresetDescriptor = {
    id: StylingPresetId;
    name: string;
    /** One line on the use case the preset serves. */
    description: string;
    /** The knob values the preset applies; the same shape {@link StylingModule.applyConfig} takes. */
    settings: StylingSettings;
};

/**
 * A serializable set of styling knob values — what {@link StylingModule.getConfig} returns and
 * {@link StylingModule.applyConfig} accepts. Persist it, put it in a pull request, or ship it as a
 * preset: re-applying it on a later SDK version keeps working for as long as the knob ids do.
 *
 * @example
 * ```typescript
 * const settings: StylingSettings = {
 *   'labels.sizeFactor': 1.2,
 *   'roads.exitNumbers': false,
 *   'traffic.flow.slowColor': '#f59e0b',
 * };
 * styling.applyConfig(settings);
 * ```
 *
 * @group Map Styling
 */
export type StylingSettings = MapModuleCommonConfig & {
    [K in StylingKnobId]?: StylingKnobValueOf<K>;
};
