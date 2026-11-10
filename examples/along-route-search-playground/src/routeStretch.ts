import { calculateProgressAtRoutePoint, type Route, type SectionType } from '@tomtom-org/maps-sdk/core';

/** The kinds of stretch worth picking. A type that tiles the whole route, such as a leg, is left out. */
const selectableSectionTypes = [
    'motorway',
    'tunnel',
    'ferry',
    'carTrain',
    'tollRoad',
    'toll',
    'urban',
    'traffic',
    'pedestrian',
    'unpaved',
    'lowEmissionZone',
    'carpool',
    'vehicleRestricted',
] as const satisfies readonly SectionType[];

export type SelectableSectionType = (typeof selectableSectionTypes)[number];

const sectionTypeLabels = {
    carpool: 'Carpool',
    carTrain: 'Car train',
    ferry: 'Ferry',
    lowEmissionZone: 'Low emission zone',
    motorway: 'Motorway',
    pedestrian: 'Pedestrian',
    toll: 'Toll',
    tollRoad: 'Toll road',
    traffic: 'Traffic',
    tunnel: 'Tunnel',
    unpaved: 'Unpaved',
    urban: 'Built-up',
    vehicleRestricted: 'Vehicle restricted',
} as const satisfies Record<SelectableSectionType, string>;

/**
 * Which part of the route to hand to along-route search.
 *
 * Section types and a share of the length are separate choices: the search takes one polyline,
 * and mixing both would hide which geometry the detour was measured on.
 */
export type StretchSelection =
    | { mode: 'whole' }
    | { mode: 'sections'; filter: 'include' | 'exclude'; sectionTypes: SelectableSectionType[] }
    | { mode: 'share'; fromPercent: number; toPercent: number };

export type RouteStretch = {
    /**
     * One polyline per contiguous stretch. A gap stays a gap: joining the coordinates would invent
     * a road between the pieces, and the detour would be measured across it.
     */
    polylines: Route['geometry']['coordinates'][];
    /** What the panel says the selection covers. */
    summary: string;
};

type Span = { start: number; end: number };

const spansOfType = (route: Route, type: SectionType): Span[] =>
    (route.properties.sections[type] ?? []).flatMap((section) => {
        const { startPointIndex, endPointIndex } = section;
        if (startPointIndex === undefined || endPointIndex === undefined || endPointIndex <= startPointIndex) {
            return [];
        }
        return [{ start: startPointIndex, end: endPointIndex }];
    });

/** Section types this route actually has, in panel order. */
export const selectableSections = (route: Route): { type: SelectableSectionType; label: string }[] =>
    selectableSectionTypes
        .filter((type) => spansOfType(route, type).length > 0)
        .map((type) => ({ type, label: sectionTypeLabels[type] }));

const mergeSpans = (spans: Span[]): Span[] => {
    const merged: Span[] = [];
    for (const span of spans.toSorted((left, right) => left.start - right.start)) {
        const last = merged.at(-1);
        if (last && span.start <= last.end) last.end = Math.max(last.end, span.end);
        else merged.push({ ...span });
    }
    return merged;
};

const without = (base: Span[], cuts: Span[]): Span[] =>
    mergeSpans(cuts).reduce(
        (spans, cut) =>
            spans.flatMap((span) => {
                if (cut.end <= span.start || cut.start >= span.end) return [span];
                const pieces: Span[] = [];
                if (cut.start > span.start) pieces.push({ start: span.start, end: cut.start });
                if (cut.end < span.end) pieces.push({ start: cut.end, end: span.end });
                return pieces.filter((piece) => piece.end > piece.start);
            }),
        base,
    );

/** The vertices covering a share of the route's length. `fromPercent` is at or below `toPercent`. */
const shareSpan = (route: Route, fromPercent: number, toPercent: number): Span | undefined => {
    const { lengthInMeters } = route.properties.summary;
    const lastIndex = route.geometry.coordinates.length - 1;
    if (lengthInMeters <= 0 || !route.properties.progress?.length || lastIndex < 1) return undefined;

    const fromMeters = (fromPercent / 100) * lengthInMeters;
    const toMeters = (toPercent / 100) * lengthInMeters;
    let start: number | undefined;
    let end: number | undefined;
    for (let index = 0; index <= lastIndex; index++) {
        const distance = calculateProgressAtRoutePoint(route, index)?.distanceInMeters;
        if (distance === undefined) return undefined;
        if (distance <= fromMeters) start = index;
        if (end === undefined && distance >= toMeters) end = index;
    }
    return start !== undefined && end !== undefined && end > start ? { start, end } : undefined;
};

const joinLabels = (labels: string[]): string => {
    if (labels.length <= 1) return labels[0] ?? '';
    const last = labels.at(-1);
    if (labels.length === 2) return `${labels[0]} and ${last}`;
    return `${labels.slice(0, -1).join(', ')} and ${last}`;
};

const stretchCount = (count: number): string => (count === 1 ? '1 stretch' : `${count} stretches`);

const polylinesOf = (route: Route, spans: Span[]): Route['geometry']['coordinates'][] =>
    spans.map((span) => route.geometry.coordinates.slice(span.start, span.end + 1));

const wholeSpan = (route: Route): Span => ({ start: 0, end: route.geometry.coordinates.length - 1 });

const sectionsStretch = (
    route: Route,
    filter: 'include' | 'exclude',
    sectionTypes: SelectableSectionType[],
): RouteStretch => {
    const labels = sectionTypes.map((type) => sectionTypeLabels[type].toLowerCase());
    const named = joinLabels(labels);
    if (sectionTypes.length === 0) {
        return filter === 'include'
            ? { polylines: [], summary: 'Tick a section type to search only those stretches.' }
            : { polylines: polylinesOf(route, [wholeSpan(route)]), summary: 'The whole route' };
    }

    const selected = mergeSpans(sectionTypes.flatMap((type) => spansOfType(route, type)));
    const spans = filter === 'include' ? selected : without([wholeSpan(route)], selected);
    if (spans.length === 0) {
        return {
            polylines: [],
            summary:
                filter === 'include' ? `No ${named} on this route.` : 'That leaves nothing of the route to search.',
        };
    }
    const count = stretchCount(spans.length);
    const lead = named.charAt(0).toUpperCase() + named.slice(1);
    return {
        polylines: polylinesOf(route, spans),
        summary: filter === 'include' ? `${lead}, ${count}` : `The route except ${named}, ${count} left`,
    };
};

/** The polylines to search, and a line for the panel describing them. */
export const routeStretch = (route: Route, selection: StretchSelection): RouteStretch => {
    if (selection.mode === 'whole') {
        return { polylines: polylinesOf(route, [wholeSpan(route)]), summary: 'The whole route' };
    }
    if (selection.mode === 'sections') return sectionsStretch(route, selection.filter, selection.sectionTypes);

    const fromPercent = Math.min(selection.fromPercent, selection.toPercent);
    const toPercent = Math.max(selection.fromPercent, selection.toPercent);
    const span = shareSpan(route, fromPercent, toPercent);
    if (!span) return { polylines: [], summary: 'That part of the route is too short to search.' };
    const whole = wholeSpan(route);
    if (span.start === whole.start && span.end === whole.end) {
        return { polylines: polylinesOf(route, [span]), summary: 'The whole route' };
    }
    return {
        polylines: polylinesOf(route, [span]),
        summary: `From ${fromPercent}% to ${toPercent}% of the route`,
    };
};
