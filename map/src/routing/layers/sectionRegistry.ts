import type { SectionType } from '@tomtom-org/maps-sdk/core';

// The section types no overlay draws at all:
//  - `country` tiles a route end to end, so a line drawn for it is a line over the whole route
//    that says only "you are in a country". What the driver wants from it is the crossing, and the
//    base map already draws that as a border. The sections stay on the route for anyone reading
//    them — the speed limit signs take their face and unit from exactly these.
//  - `lanes` describes a lane-assist HUD, not a geographic overlay.
//  - `leg` is route structure, already on screen as the waypoints between legs.
//  - `roadShields` needs shield images from the atlas the response points at, plus a symbol layer.
//  - `toll` is already on screen: `tollRoad` reports every stretch it does and more, so a second
//    overlay would draw the same geometry twice.
type UndrawnSectionType = 'country' | 'lanes' | 'leg' | 'roadShields' | 'toll';

/**
 * A section type the module draws, and therefore one the caller can configure.
 *
 * @remarks
 * Every section type the API can return, less the ones nothing draws. Derived from the core
 * {@link SectionType} vocabulary, and {@link SECTION_REGISTRY} is keyed by it, so a section type
 * added to core has to be registered there or named undrawn above before this package compiles.
 *
 * @group Routing
 */
export type DrawnSectionType = Exclude<SectionType, UndrawnSectionType>;

/**
 * The section types whose layers are generated from {@link SECTION_REGISTRY}.
 *
 * @remarks
 * Plain line overlays over the route, one registration each. The remaining drawn types
 * ({@link bespokeSectionTypes}) carry type-specific icons or data-driven colours, so they keep
 * hand-written layers — but they take the same {@link SectionDisplayConfig} knobs.
 *
 * @group Routing
 */
export const generatedSectionTypes = [
    'carpool',
    'carTrain',
    'importantRoadStretch',
    'lowEmissionZone',
    'motorway',
    'pedestrian',
    'speedLimit',
    'tollVignette',
    'unpaved',
    'urban',
] as const;

/**
 * The drawn section types whose layers are hand-written rather than generated.
 *
 * @group Routing
 */
export const bespokeSectionTypes = ['ferry', 'tollRoad', 'traffic', 'tunnel', 'vehicleRestricted'] as const;

/**
 * A section type whose layers are generated from the registry.
 * @group Routing
 */
export type GeneratedSectionType = (typeof generatedSectionTypes)[number];

/**
 * A drawn section type with hand-written layers.
 * @group Routing
 */
export type BespokeSectionType = (typeof bespokeSectionTypes)[number];

/**
 * Every drawn section type, generated ones first.
 * @group Routing
 */
export const drawnSectionTypes = [
    ...generatedSectionTypes,
    ...bespokeSectionTypes,
] as const satisfies readonly DrawnSectionType[];

/**
 * How a section's line relates to the route line it marks — both where it sits in the layer order
 * and how wide it is drawn, since neither reads as intended without the other.
 *
 * @remarks
 * - `halo`: beneath the route's own lines and wider than its outline, so the section shows as a
 *   band hugging the route on both sides. The route keeps its own colour.
 * - `inline`: above the route line at the route's own width, so the route itself appears in the
 *   section's colour along that stretch. This is how `tunnel` and `ferry` draw.
 *
 * Every section defaults to whichever of the two it has always been drawn as.
 *
 * @group Routing
 */
export type SectionDrawStyle = 'halo' | 'inline';

/**
 * The line pattern of a section.
 * @group Routing
 */
export type SectionLinePattern = 'solid' | 'dashed' | 'dotted';

/**
 * One of the uniform knobs {@link SectionDisplayConfig} offers.
 * @group Routing
 */
export type SectionKnobName = 'visible' | 'color' | 'opacity' | 'width' | 'style' | 'pattern' | 'icon' | 'sign';

// The knobs a section that bands the route answers to — every one but `traffic`, which colours and
// dashes its line from the incident data.
const ALL_SECTION_KNOBS = [
    'visible',
    'color',
    'opacity',
    'width',
    'style',
    'pattern',
    'icon',
] as const satisfies readonly SectionKnobName[];

// The knobs a section that posts a sign answers to. None of the band knobs are among them: there
// is no line to colour, widen, dash or place an icon on.
const SIGN_SECTION_KNOBS = ['visible', 'sign'] as const satisfies readonly SectionKnobName[];

// The source each drawn type's features live in. The generated types get one each; the five with
// hand-written layers keep the source names they have always had.
type SectionSourceKeys = {
    ferry: 'ferries';
    tollRoad: 'tollRoads';
    traffic: 'incidents';
    tunnel: 'tunnels';
    vehicleRestricted: 'vehicleRestricted';
} & { [T in GeneratedSectionType]: `${T}Sections` };

/**
 * The key one section type's source, events scope and `getShown()` entry are filed under.
 *
 * @remarks
 * `routing.events[sectionSourceKey('lowEmissionZone')]` and
 * `routing.getShown()[sectionSourceKey('tunnel')]` both reach the section named by the type.
 *
 * @group Routing
 */
export type SectionSourceKey<T extends DrawnSectionType = DrawnSectionType> = (typeof SECTION_REGISTRY)[T]['sourceKey'];

type SectionRegistryEntry<T extends DrawnSectionType> = {
    /**
     * The key of the source holding this type's features, and of the layer specs drawn from it.
     */
    sourceKey: SectionSourceKeys[T];
    /**
     * Whether the type is drawn when nothing is configured.
     *
     * A type draws itself when its stretches are **sparse** along a route and **consequential**
     * for the driver — a stretch to pay for (`tollRoad`, `tollVignette`), to qualify for
     * (`lowEmissionZone`, `vehicleRestricted`), to drive the car aboard (`carTrain`, `ferry`),
     * to lose the signal in (`tunnel`), or to lose time on (`traffic`). A type
     * whose stretches cover most of a route is opt-in however consequential it is, because a band
     * that is everywhere says nothing and buries the route line: `motorway` and `urban` each run
     * nearly the whole length. So is a type the base map already draws, since the route overlay
     * would only repeat it.
     *
     * A type that posts a sign rather than a band escapes that rule — `speedLimit` covers the
     * whole route and still draws itself, because a sign is legible wherever it lands.
     */
    visible: boolean;
    /**
     * Where the type's line sits against the route line, and so how wide it is drawn. The generated
     * types that band the route sit beneath it; the five that draw themselves keep the relation they
     * have always had — `tollRoad` a band, the rest the route line's own colour along the stretch.
     *
     * Absent on a type whose presentation is a sign, which draws no line to place.
     */
    style?: SectionDrawStyle;
    /**
     * The line pattern the type is drawn with when nothing is configured. A broken line marks a
     * stretch the driver does not simply drive along as usual — the car carried (`carTrain`), the
     * surface unpaved, the access permit-bound or restricted.
     *
     * On a type drawn with two lines the pattern belongs to the principal one, so the outline
     * stays solid beneath it. Absent on a type whose presentation is a sign.
     */
    pattern?: SectionLinePattern;
    /**
     * The knobs this type answers to. A knob a type cannot honour is left out of the catalogue
     * rather than accepted and ignored — `traffic` colours its line by `magnitudeOfDelay`, so it
     * offers no `color`, and its icons come from the incident data, so it offers no `icon`.
     */
    knobs: readonly SectionKnobName[];
};

/**
 * What every drawn section type is, and which knobs it answers to.
 *
 * @remarks
 * The single table the section tier is built from: the layer specs, the per-type sources, the
 * visibility rules and the knob catalogue all read it, so none of them can drift from the others.
 * @ignore
 */
export const SECTION_REGISTRY = {
    carpool: {
        sourceKey: 'carpoolSections',
        visible: false,
        style: 'halo',
        pattern: 'solid',
        knobs: ALL_SECTION_KNOBS,
    },
    carTrain: {
        sourceKey: 'carTrainSections',
        visible: true,
        style: 'halo',
        pattern: 'dashed',
        knobs: ALL_SECTION_KNOBS,
    },
    importantRoadStretch: {
        sourceKey: 'importantRoadStretchSections',
        visible: false,
        style: 'halo',
        pattern: 'solid',
        knobs: ALL_SECTION_KNOBS,
    },
    lowEmissionZone: {
        sourceKey: 'lowEmissionZoneSections',
        visible: true,
        style: 'halo',
        pattern: 'solid',
        knobs: ALL_SECTION_KNOBS,
    },
    motorway: {
        sourceKey: 'motorwaySections',
        visible: false,
        style: 'halo',
        pattern: 'solid',
        knobs: ALL_SECTION_KNOBS,
    },
    pedestrian: {
        sourceKey: 'pedestrianSections',
        visible: false,
        style: 'halo',
        pattern: 'dashed',
        knobs: ALL_SECTION_KNOBS,
    },
    // The one type asked for a number rather than a stretch, so a sign per section is its whole
    // presentation. A line would mark every stretch that carries a limit — which is all of them,
    // since the limit changes at nearly every junction — and still never say what the limit is.
    speedLimit: {
        sourceKey: 'speedLimitSections',
        visible: true,
        knobs: SIGN_SECTION_KNOBS,
    },
    tollVignette: {
        sourceKey: 'tollVignetteSections',
        visible: true,
        style: 'halo',
        pattern: 'dashed',
        knobs: ALL_SECTION_KNOBS,
    },
    unpaved: {
        sourceKey: 'unpavedSections',
        visible: false,
        style: 'halo',
        pattern: 'dashed',
        knobs: ALL_SECTION_KNOBS,
    },
    urban: { sourceKey: 'urbanSections', visible: false, style: 'halo', pattern: 'solid', knobs: ALL_SECTION_KNOBS },
    ferry: { sourceKey: 'ferries', visible: true, style: 'inline', pattern: 'solid', knobs: ALL_SECTION_KNOBS },
    tollRoad: { sourceKey: 'tollRoads', visible: true, style: 'halo', pattern: 'solid', knobs: ALL_SECTION_KNOBS },
    traffic: {
        sourceKey: 'incidents',
        visible: true,
        style: 'inline',
        pattern: 'solid',
        knobs: ['visible', 'opacity', 'width', 'style'],
    },
    tunnel: { sourceKey: 'tunnels', visible: true, style: 'inline', pattern: 'solid', knobs: ALL_SECTION_KNOBS },
    vehicleRestricted: {
        sourceKey: 'vehicleRestricted',
        visible: true,
        style: 'inline',
        pattern: 'dotted',
        knobs: ALL_SECTION_KNOBS,
    },
} as const satisfies { [T in DrawnSectionType]: SectionRegistryEntry<T> };

/**
 * The knobs one section type answers to.
 *
 * @remarks
 * Read off {@link SECTION_REGISTRY}, so `sections.traffic.color` is a compile error rather than a
 * setting that draws nothing: `traffic` colours its line by `magnitudeOfDelay`.
 *
 * @group Routing
 */
export type SectionKnobOf<T extends DrawnSectionType = DrawnSectionType> =
    (typeof SECTION_REGISTRY)[T]['knobs'][number];

/**
 * Whether the given type answers to the given knob.
 *
 * @remarks
 * What a panel of section controls asks to decide which controls to render — the type system says
 * the same thing through {@link SectionKnobOf}, but only a value can be looped over.
 *
 * @example
 * ```typescript
 * for (const knobName of ['color', 'opacity', 'pattern'] as const) {
 *     if (sectionSupportsKnob(type, knobName)) renderControl(type, knobName);
 * }
 * ```
 *
 * @group Routing
 */
export const sectionSupportsKnob = (type: DrawnSectionType, knobName: SectionKnobName): boolean =>
    (SECTION_REGISTRY[type].knobs as readonly SectionKnobName[]).includes(knobName);

/**
 * One type's registry entry, widened from the literal table.
 *
 * @remarks
 * {@link SECTION_REGISTRY} is `as const`, so indexing it with a union of types gives a union of
 * entry literals — and the band fields, which only the types that draw a band carry at all, cannot
 * be read off that union. Widening to the declared entry shape is what makes them readable as the
 * optionals they are.
 * @ignore
 */
export const sectionEntry = (type: DrawnSectionType): SectionRegistryEntry<DrawnSectionType> => SECTION_REGISTRY[type];

/**
 * Whether the given type draws itself when `sections` says nothing about it.
 *
 * @remarks
 * The answer a panel of section controls needs to show which switches start on. Asking the map
 * instead cannot answer it: a type draws no layer for a route carrying none of its sections, so an
 * absent layer reads the same as a type switched off.
 *
 * @example
 * ```typescript
 * const [drawn, optIn] = partition(drawnSectionTypes, sectionDrawsByDefault);
 * ```
 *
 * @group Routing
 */
export const sectionDrawsByDefault = (type: DrawnSectionType): boolean => SECTION_REGISTRY[type].visible;

/**
 * A generated type whose presentation is a road sign carrying the section's own value.
 *
 * @remarks
 * Derived from the knob catalogue, so offering `sign` and being drawn as one are the same fact.
 * @ignore
 */
export type SignPostingSectionType = {
    [T in GeneratedSectionType]: 'sign' extends SectionKnobOf<T> ? T : never;
}[GeneratedSectionType];

/**
 * A generated type whose presentation is a band along the stretch it covers.
 * @ignore
 */
export type BandedSectionType = Exclude<GeneratedSectionType, SignPostingSectionType>;

/**
 * Whether the given generated type posts a sign rather than banding the route.
 * @ignore
 */
export const postsSign = (type: GeneratedSectionType): type is SignPostingSectionType =>
    sectionSupportsKnob(type, 'sign');

/**
 * The generated types that band the route — every one whose value is not its own presentation.
 * @ignore
 */
export const bandedSectionTypes = generatedSectionTypes.filter((type): type is BandedSectionType => !postsSign(type));

/**
 * The key the given section type's source, events scope and `getShown()` entry are filed under.
 *
 * @example
 * ```typescript
 * routing.events[sectionSourceKey('lowEmissionZone')].on('click', (section) => { … });
 * const tunnels = routing.getShown()[sectionSourceKey('tunnel')];
 * ```
 *
 * @group Routing
 */
export const sectionSourceKey = <T extends DrawnSectionType>(type: T): SectionSourceKey<T> =>
    SECTION_REGISTRY[type].sourceKey;
