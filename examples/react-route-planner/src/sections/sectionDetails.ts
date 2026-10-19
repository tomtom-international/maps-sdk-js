import {
    getImportantRoads,
    getSectionOverlap,
    type ImportantRoadStretchProps,
    type Maneuver,
    type RoadInformation,
    type Route,
    type RouteProgressAtPoint,
    type SectionProps,
    type TrafficIncidentCategory,
} from '@tomtom-org/maps-sdk/core';
import { addSeconds, clockTime, distance, duration, progressInto } from '../format';
import { isCountry, isTraffic, type LaneBlock, type LaneId } from './routeLanes';

export type RoutePosition = Route['geometry']['coordinates'][number];

/** One end of a section: when the trip gets there, how far into it, and the road it is on. */
export type SectionEnd = {
    clock: string;
    into: string;
    road?: string;
    position: RoutePosition;
};

export type SectionFact = { term: string; value: string };

export type SectionDetails = {
    title: string;
    span: string;
    start: SectionEnd;
    end: SectionEnd;
    facts: SectionFact[];
};

const unique = (labels: (string | undefined)[]): string[] => [
    ...new Set(labels.filter((label): label is string => Boolean(label))),
];

const joinLabels = (labels: (string | undefined)[]): string | undefined => unique(labels).join(' · ') || undefined;

const roadNumbersOf = ({ roadShields }: RoadInformation): string[] =>
    roadShields?.map((shield) => shield.roadNumber.text) ?? [];

const stretchLabel = ({ roadNumbers, streetName }: ImportantRoadStretchProps) =>
    joinLabels([...(roadNumbers ?? []), streetName]);

const instructionsOf = (route: Route) => route.properties.guidance?.instructions ?? [];

/**
 * The road between point `segment` of the route and the next: the road the next maneuver leaves, as
 * guidance names it, else the most important road stretch over it.
 */
const roadOnSegment = (route: Route, segment: number): string | undefined => {
    const nextManeuver = instructionsOf(route).find((instruction) => instruction.pathPointIndex > segment);
    const fromGuidance =
        nextManeuver &&
        joinLabels([...roadNumbersOf(nextManeuver.previousRoadInfo), nextManeuver.previousRoadInfo.streetName?.text]);
    // A stretch, not getImportantRoads: a segment can measure 0 m, where a stop repeats its vertex.
    const segmentSpan = { startPointIndex: segment, endPointIndex: segment + 1 };
    const stretch = route.properties.sections.importantRoadStretch
        ?.filter((candidate) => getSectionOverlap(candidate, segmentSpan))
        .sort((first, second) => first.index - second.index)[0];
    return fromGuidance ?? (stretch && stretchLabel(stretch));
};

/** The road numbers along a section, in route order: guidance first, then the stretches and the shields. */
const roadNumbersAlong = (route: Route, section: SectionProps): string[] => {
    const ahead = instructionsOf(route).filter((instruction) => instruction.pathPointIndex > section.startPointIndex);
    const lastIndex = ahead.findIndex((instruction) => instruction.pathPointIndex >= section.endPointIndex);
    const covering = lastIndex === -1 ? ahead : ahead.slice(0, lastIndex + 1);
    const { roadShields = [] } = route.properties.sections;
    return unique([
        ...covering.flatMap((instruction) => roadNumbersOf(instruction.previousRoadInfo)),
        ...getImportantRoads(route, { within: [section] }).flatMap((road) => road.roadNumbers),
        ...roadShields
            .filter((shields) => getSectionOverlap(shields, section))
            .flatMap((shields) => shields.roadShieldReferences.map((reference) => reference.shieldContent)),
    ]);
};

const speedLimitsAlong = (route: Route, section: SectionProps): string | undefined => {
    const limits = (route.properties.sections.speedLimit ?? [])
        .filter((limit) => getSectionOverlap(limit, section))
        .map((limit) => limit.maxSpeedLimitInKmh);
    if (!limits.length) return undefined;

    const [lowest, highest] = [Math.min(...limits), Math.max(...limits)];
    return lowest === highest ? `${lowest} km/h` : `${lowest}–${highest} km/h`;
};

const countryName = (codeISO2: string): string =>
    new Intl.DisplayNames(undefined, { type: 'region' }).of(codeISO2) ?? codeISO2;

const categoryLabel = (category: TrafficIncidentCategory): string =>
    `${category.charAt(0).toUpperCase()}${category.slice(1).replaceAll('-', ' ')}`;

/** What guidance says at the `maneuver` closest to `pointIndex`, such as boarding a ferry. */
const maneuverMessage = (route: Route, maneuver: Maneuver, pointIndex: number) =>
    instructionsOf(route)
        .filter((instruction) => instruction.maneuver === maneuver)
        .sort(
            (first, second) =>
                Math.abs(first.pathPointIndex - pointIndex) - Math.abs(second.pathPointIndex - pointIndex),
        )[0]?.message;

const onBoardFacts =
    (boarding: Maneuver, leaving: Maneuver) =>
    (route: Route, section: SectionProps): SectionFact[] => [
        ...fact('Boarding', maneuverMessage(route, boarding, section.startPointIndex)),
        ...fact('Leaving', maneuverMessage(route, leaving, section.endPointIndex)),
    ];

const vignetteCountries = (route: Route, section: SectionProps): string[] =>
    unique(
        (route.properties.sections.tollVignette ?? [])
            .filter((vignette) => getSectionOverlap(vignette, section))
            .map((vignette) => countryName(vignette.countryCodeISO2)),
    );

const fact = (term: string, value: string | undefined): SectionFact[] => (value ? [{ term, value }] : []);

/** What only one kind of section can say about itself. */
const laneFacts: Partial<Record<LaneId, (route: Route, section: SectionProps) => SectionFact[]>> = {
    traffic: (_, section) =>
        isTraffic(section)
            ? [
                  ...fact('Delay', section.delayInSeconds ? duration(section.delayInSeconds) : undefined),
                  ...fact(
                      'Speed through it',
                      section.effectiveSpeedInKmh === undefined ? undefined : `${section.effectiveSpeedInKmh} km/h`,
                  ),
                  ...fact('Cause', section.categories.map(categoryLabel).join(', ')),
              ]
            : [],
    country: (route, section) => {
        if (!isCountry(section)) return [];

        const needsVignette = (route.properties.sections.tollVignette ?? []).some(
            (vignette) => vignette.countryCodeISO3 === section.countryCodeISO3,
        );
        return [
            ...fact('Code', `${section.countryCodeISO2} · ${section.countryCodeISO3}`),
            ...fact('Vignette', needsVignette ? 'Needed on this route' : 'Not needed on this route'),
        ];
    },
    toll: (route, section) => {
        const perUse = (route.properties.sections.toll ?? []).some((toll) => getSectionOverlap(toll, section));
        const vignette = vignetteCountries(route, section);
        const payment = [
            ...(perUse ? ['Pay per use'] : []),
            ...(vignette.length ? [`Vignette (${vignette.join(', ')})`] : []),
        ];
        return fact('Payment', payment.join(', ') || 'Charged road');
    },
    ferry: onBoardFacts('TAKE_SHIP_FERRY', 'LEAVE_SHIP_FERRY'),
    carTrain: onBoardFacts('TAKE_CAR_TRAIN', 'LEAVE_CAR_TRAIN'),
};

const sectionEnd = (route: Route, progress: RouteProgressAtPoint, pointIndex: number, segment: number): SectionEnd => ({
    clock: clockTime(addSeconds(route.properties.summary.departureTime, progress.travelTimeInSeconds)),
    into: progress.travelTimeInSeconds ? progressInto(progress) : 'At departure',
    road: roadOnSegment(route, segment),
    position: route.geometry.coordinates[pointIndex],
});

/** Everything the route itself says about one of its sections; the places near its ends are looked up apart. */
export const sectionDetails = (route: Route, block: LaneBlock): SectionDetails => {
    const { section, start, end } = block;
    const seconds = end.travelTimeInSeconds - start.travelTimeInSeconds;
    const meters = end.distanceInMeters - start.distanceInMeters;
    const isOnBoard = block.lane === 'ferry' || block.lane === 'carTrain';
    const roads = roadNumbersAlong(route, section);
    return {
        title: isCountry(section) ? countryName(section.countryCodeISO2) : block.label,
        span: `${seconds < 30 ? 'Under a minute' : duration(seconds)} · ${distance(meters)}`,
        start: sectionEnd(route, start, section.startPointIndex, section.startPointIndex),
        end: sectionEnd(route, end, section.endPointIndex, section.endPointIndex - 1),
        facts: [
            ...(laneFacts[block.lane]?.(route, section) ?? []),
            ...fact(
                'Average speed',
                block.lane !== 'traffic' && seconds > 0 ? `${Math.round((meters / seconds) * 3.6)} km/h` : undefined,
            ),
            ...fact('Speed limits', isOnBoard ? undefined : speedLimitsAlong(route, section)),
            ...fact('Roads', isOnBoard ? undefined : roads.slice(0, 6).join(' · ')),
        ],
    };
};
