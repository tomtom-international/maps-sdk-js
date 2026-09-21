/**
 * The kind of value a display knob takes.
 *
 * @remarks
 * One vocabulary for every knob catalogue in the SDK — map styling and any module that describes
 * its display as knobs draw from the same set, so an agent that learned one catalogue can read the
 * other.
 *
 * - `toggle`: `true`/`false`, e.g. whether an overlay is drawn.
 * - `factor`: a multiplier over what the style already does (`1` = unchanged).
 * - `number`: an absolute number with a range.
 * - `color`: a CSS colour string.
 * - `enum`: one of the knob's `options`.
 * @group Shared
 */
export type KnobKind = 'toggle' | 'factor' | 'number' | 'color' | 'enum';

/**
 * Inclusive bounds for a `factor` or `number` knob. `step` is what a slider would use; some ranges
 * (e.g. opacity 0–1) have no natural step and omit it.
 *
 * @group Shared
 */
export type KnobRange = { min: number; max: number; step?: number };

/**
 * A single, machine-readable description of one display knob.
 *
 * @remarks
 * The point of describing knobs as data is that a caller — increasingly a coding agent rather than
 * a person reading docs — can ask what a module actually exposes instead of guessing layer ids from
 * training data. Three things follow from having it:
 *
 * - **ground before generating** — write against what the module exposes, not what you remember;
 * - **validate** — ranges and allowed values arrive as data, so a bad value is caught before it
 *   is rendered;
 * - **report and diff** — the paired settings object is plain and serializable, so a display change
 *   is reviewable in a pull request.
 *
 * A visual editor cannot do any of those: it cannot be read, diffed, or put in a pull request.
 *
 * Modules narrow this shape with their own descriptor type — e.g. `StylingKnobDescriptor` requires
 * `available` and `appliesTo`, while a module whose knobs are always applicable omits them.
 *
 * @group Shared
 */
export type KnobDescriptor<T = unknown> = {
    /**
     * Stable, dotted identifier, e.g. `labels.sizeFactor`. Treat these as public API: they are what
     * a caller stores, diffs and passes back.
     */
    id: string;
    /** What kind of value the knob takes. */
    kind: KnobKind;
    /** One-line description of what turning this knob does. */
    description: string;
    /** The value in force when nothing has been configured. */
    default: T;
    /** The value in force now. */
    current: T;
    /** Whether {@link KnobDescriptor.current} came from configuration rather than the default. */
    overridden: boolean;
    /** Inclusive bounds, for `factor` and `number` knobs. */
    range?: KnobRange;
    /** The allowed values, for `enum` knobs. */
    options?: readonly string[];
    /**
     * Whether the knob has anything to work on in the loaded style. Omitted by modules whose knobs
     * are always applicable; set to `false` by modules where a knob can be present in the catalogue
     * but do nothing on the current style.
     */
    available?: boolean;
    /**
     * Which styles or contexts the knob works in. A string rather than a fixed union so each
     * module can choose its own vocabulary — styling uses `'any-style' | 'tomtom-styles'`.
     */
    appliesTo?: string;
};

/**
 * Builds one knob descriptor, working out `overridden` from whether a configured value was given.
 * Pass `available` / `appliesTo` / `range` / `options` through `extra` when the module uses them.
 * @ignore
 */
export const knob = <T, ID extends string, KIND extends KnobKind, Extra extends object = Record<string, never>>(
    id: ID,
    kind: KIND,
    description: string,
    defaultValue: T,
    configured: T | undefined,
    extra?: Extra,
): KnobDescriptor<T> & { id: ID; kind: KIND } & Extra =>
    // TypeScript cannot narrow a literal spreading a generic to that generic's own intersection.
    ({
        id,
        kind,
        description,
        default: defaultValue,
        current: configured ?? defaultValue,
        overridden: configured !== undefined,
        ...extra,
    }) as KnobDescriptor<T> & { id: ID; kind: KIND } & Extra;

/**
 * Reduces a knob catalogue to a plain, serializable object of the values in force.
 *
 * @remarks
 * Only knobs whose value was configured are included, so the result is a diff against the defaults
 * rather than a dump of everything — which is what makes it reviewable.
 * @ignore
 */
export const knobSettings = (knobs: KnobDescriptor[]): Record<string, unknown> =>
    Object.fromEntries(knobs.filter((entry) => entry.overridden).map((entry) => [entry.id, entry.current]));
