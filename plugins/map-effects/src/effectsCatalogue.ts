import type { KnobKind, KnobRange } from '@tomtom-org/maps-sdk/map';
import { type BloomScope, bloomScopeNames } from './bloomScope';

/**
 * The range of a numeric effect knob. Every one ships a slider `step`; the shared {@link KnobRange}
 * leaves it optional.
 *
 * @group Map Effects
 */
export type EffectKnobRange = KnobRange & { step: number };

/**
 * One effect knob, drawn from the SDK's shared knob vocabulary — so a UI or an agent built for
 * `StylingModule.describe()` reads this catalogue unchanged. Discriminated on `kind`: a range
 * belongs to a numeric knob and the accepted names to a `colors` one.
 * @ignore
 */
export type EffectKnobDefinition = {
    description: string;
    /** The practical problem the effect solves — the reason it exists in an SDK with no artistic ambitions. */
    useCase: string;
} & (
    | { kind: Extract<KnobKind, 'number'>; default: number; range: EffectKnobRange }
    | { kind: Extract<KnobKind, 'color'>; default: string }
    | { kind: Extract<KnobKind, 'colors'>; default: BloomScope; options: readonly string[] }
);

const FRACTION: EffectKnobRange = { min: 0, max: 1, step: 0.05 };

// The practical problem each effect solves. Every knob of one effect carries the same one.
const USE_CASE = {
    bloom: 'Emphasis on dark and driving styles.',
    grade: 'Muting the base map under a data overlay.',
    fog: 'Depth cue: the far context recedes as if seen through air.',
    edgeBlur: 'Focus: the centre stays sharp and the edges lose their detail.',
    depthOfField: 'Depth on a tilted map: one band of distance stays sharp, the rest defocuses with distance.',
    tint: 'Muting the base map under a data overlay; matching a brand.',
    vignette: 'Focus on the centre of the view.',
} as const;

/**
 * The effects catalogue. Every effect is off at its default; each is named by the product problem it
 * solves. Ordering is the compositing order the overlays stack in — bloom → grade → fog → edge blur
 * → tint → vignette — with the depth of field listed beside the other defocus, though it is a GPU
 * pass under all of them rather than one of them.
 * @ignore
 */
export const effectKnobDefinitions = {
    'bloom.intensity': {
        kind: 'number',
        description: 'How strongly bright features (lit roads, traffic tubes, route lines) glow. 0 = off.',
        default: 0,
        range: FRACTION,
        useCase: USE_CASE.bloom,
    },
    'bloom.radius': {
        kind: 'number',
        description: 'How far the glow spreads, in CSS pixels.',
        default: 12,
        range: { min: 2, max: 40, step: 1 },
        useCase: USE_CASE.bloom,
    },
    'bloom.threshold': {
        kind: 'number',
        description: 'Brightness below which nothing glows. Raise it so only the brightest features light up.',
        default: 0.55,
        range: FRACTION,
        useCase: USE_CASE.bloom,
    },
    'bloom.only': {
        kind: 'colors',
        description:
            'The colours bloom may light: CSS colours, styling colour knobs or groups of them (`traffic`, `traffic.incidents.majorColor`), read from the loaded style. Only the pixels wearing one of them glow; empty lights the whole frame.',
        default: [],
        options: bloomScopeNames,
        useCase: USE_CASE.bloom,
    },
    'bloom.onlyTolerance': {
        kind: 'number',
        description:
            "How far a pixel may sit from one of the scope's colours and still glow. Raise it when antialiasing has mixed the colour with the map underneath; lower it when a neighbouring severity is glowing too.",
        // The TomTom styles put a moderate jam 0.217 from a major one in chromaticity; from 0.22 up
        // a major-jam scope lets in every reddish jam.
        default: 0.15,
        range: FRACTION,
        useCase: USE_CASE.bloom,
    },
    'grade.brightness': {
        kind: 'number',
        description: 'Brightness of the whole base map (1 = unchanged).',
        default: 1,
        range: { min: 0.5, max: 1.5, step: 0.05 },
        useCase: USE_CASE.grade,
    },
    'grade.contrast': {
        kind: 'number',
        description: 'Contrast of the whole base map (1 = unchanged).',
        default: 1,
        range: { min: 0.5, max: 1.5, step: 0.05 },
        useCase: USE_CASE.grade,
    },
    'grade.saturation': {
        kind: 'number',
        description: 'Colour saturation of the whole base map (1 = unchanged, 0 = greyscale).',
        default: 1,
        range: { min: 0, max: 1.5, step: 0.05 },
        useCase: USE_CASE.grade,
    },
    'fog.intensity': {
        kind: 'number',
        description:
            'Haze over the edges of the view: blur, plus a wash towards the colour of the air — pale on a light map, dark on a dark one. Reads as distance. 0 = off.',
        default: 0,
        range: FRACTION,
        useCase: USE_CASE.fog,
    },
    'fog.reach': {
        kind: 'number',
        description: 'How far the fog reaches in from the edges (1 = to the centre).',
        default: 0.4,
        range: FRACTION,
        useCase: USE_CASE.fog,
    },
    'edgeBlur.intensity': {
        kind: 'number',
        description:
            'Blur over the edges of the view, in CSS pixels, leaving their colour untouched. Reads as a lens, not as distance — `fog` is the effect that also washes the rim out. 0 = off.',
        default: 0,
        range: { min: 0, max: 30, step: 1 },
        useCase: USE_CASE.edgeBlur,
    },
    'edgeBlur.reach': {
        kind: 'number',
        description: 'How far the edge blur reaches in from the edges (1 = to the centre).',
        default: 0.5,
        range: FRACTION,
        useCase: USE_CASE.edgeBlur,
    },
    'depthOfField.intensity': {
        kind: 'number',
        description:
            'The widest circle of confusion, in CSS pixels — the blur the most out-of-focus distance gets. Needs a tilted camera: a map seen from straight above has no depth, and the effect ends there on its own. 0 = off.',
        default: 0,
        range: { min: 0, max: 30, step: 1 },
        useCase: USE_CASE.depthOfField,
    },
    'depthOfField.focus': {
        kind: 'number',
        description:
            'Which distance is sharp, across what the frame shows: 0 the nearest ground at the bottom of the view, 1 the farthest at the top.',
        default: 0,
        range: FRACTION,
        useCase: USE_CASE.depthOfField,
    },
    'depthOfField.band': {
        kind: 'number',
        description:
            'How much of that depth stays sharp — the field itself. Thin is the miniature; wide holds a whole run of the map. A gentle tilt has little depth, so the same value covers more of the view.',
        default: 0.3,
        range: FRACTION,
        useCase: USE_CASE.depthOfField,
    },
    'depthOfField.bokeh': {
        kind: 'number',
        description:
            'Whether an out-of-focus highlight fades or comes back as a disc of light. 0 averages the light away, as a blur does; turned up, a lit road or a traffic tube keeps its brightness across the whole circle it is spread over.',
        default: 0.5,
        range: FRACTION,
        useCase: USE_CASE.depthOfField,
    },
    'tint.color': {
        kind: 'color',
        description: 'A flat colour laid over the whole map.',
        default: '#1f2937',
        useCase: USE_CASE.tint,
    },
    'tint.opacity': {
        kind: 'number',
        description: 'Opacity of the tint. 0 = off.',
        default: 0,
        range: FRACTION,
        useCase: USE_CASE.tint,
    },
    'vignette.intensity': {
        kind: 'number',
        description: 'Darkening (negative) or lightening (positive) towards the edges. 0 = off.',
        default: 0,
        range: { min: -1, max: 1, step: 0.05 },
        useCase: USE_CASE.vignette,
    },
    'vignette.reach': {
        kind: 'number',
        description: 'How far the vignette reaches in from the edges (1 = to the centre).',
        default: 0.45,
        range: FRACTION,
        useCase: USE_CASE.vignette,
    },
} as const satisfies Record<string, EffectKnobDefinition>;

/**
 * The id of an effect knob, as accepted by {@link MapEffects.set}.
 *
 * @group Map Effects
 */
export type EffectKnobId = keyof typeof effectKnobDefinitions;

/**
 * Every effect knob id, in compositing order.
 *
 * @group Map Effects
 */
export const effectKnobIds = Object.keys(effectKnobDefinitions) as EffectKnobId[];

/**
 * The value type an effect knob takes.
 *
 * @group Map Effects
 */
export type EffectKnobValueOf<ID extends EffectKnobId> = Extract<
    EffectKnobDefinition,
    { kind: (typeof effectKnobDefinitions)[ID]['kind'] }
>['default'];
