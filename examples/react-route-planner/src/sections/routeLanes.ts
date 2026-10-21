import {
    type CountrySectionProps,
    type CurvyStretchSectionProps,
    type DelayMagnitude,
    getRouteProgressForSection,
    type Route,
    type RouteProgressAtPoint,
    type SectionProps,
    type SectionsProps,
    type TrafficSectionProps,
} from '@tomtom-org/maps-sdk/core';
import { duration } from '../format';
import { keysOf } from '../keysOf';
import type { ChipLook } from '../panel/fields';
import { roadIcons } from '../panel/icons';

export type Axis = 'distance' | 'time';

type LaneDefinition = {
    label: string;
    sections: (sections: SectionsProps) => SectionProps[] | undefined;
    blockLabel: (section: SectionProps, index: number) => string;
    tone?: (section: SectionProps, index: number) => string | undefined;
};

export const isTraffic = (section: SectionProps): section is TrafficSectionProps => 'magnitudeOfDelay' in section;

export const isCountry = (section: SectionProps): section is CountrySectionProps => 'countryCodeISO3' in section;

export const isCurvyStretch = (section: SectionProps): section is CurvyStretchSectionProps => 'curveCount' in section;

const trafficLabels: Record<DelayMagnitude, string> = {
    unknown: 'Traffic',
    minor: 'Light traffic',
    moderate: 'Slow traffic',
    major: 'Heavy traffic',
    indefinite: 'Closed or blocked',
};

const trafficLabel = (section: SectionProps) => {
    if (!isTraffic(section)) return 'Traffic';

    const delay = section.delayInSeconds ? `, ${duration(section.delayInSeconds)} delay` : '';
    return `${trafficLabels[section.magnitudeOfDelay]}${delay}`;
};

const named = (label: string) => () => label;

/** The lanes, top to bottom. A route without a section type has no lane for it. */
const laneDefinitions = {
    traffic: {
        label: 'Traffic',
        sections: (sections) => sections.traffic,
        blockLabel: trafficLabel,
        tone: (section) => (isTraffic(section) ? `is-${section.magnitudeOfDelay}` : undefined),
    },
    motorway: { label: 'Motorway', sections: (sections) => sections.motorway, blockLabel: named('Motorway') },
    // The map draws the toll roads, so the bar shows those, for a hover on one to find the other.
    toll: {
        label: 'Tolls',
        sections: (sections) => sections.tollRoad ?? sections.toll,
        blockLabel: named('Toll road'),
    },
    tunnel: { label: 'Tunnels', sections: (sections) => sections.tunnel, blockLabel: named('Tunnel') },
    ferry: { label: 'Ferries', sections: (sections) => sections.ferry, blockLabel: named('Ferry') },
    carTrain: { label: 'Car trains', sections: (sections) => sections.carTrain, blockLabel: named('Car train') },
    lowEmissionZone: {
        label: 'Low emission',
        sections: (sections) => sections.lowEmissionZone,
        blockLabel: named('Low emission zone'),
    },
    urban: { label: 'Built-up', sections: (sections) => sections.urban, blockLabel: named('Built-up area') },
    unpaved: { label: 'Unpaved', sections: (sections) => sections.unpaved, blockLabel: named('Unpaved road') },
    curvyStretch: {
        label: 'Curvy roads',
        sections: (sections) => sections.curvyStretch,
        blockLabel: (section) => (isCurvyStretch(section) ? `${section.curveCount} curves` : 'Curvy road'),
    },
    country: {
        label: 'Countries',
        sections: (sections) => sections.country,
        blockLabel: (section) => (isCountry(section) ? section.countryCodeISO3 : 'Country'),
        tone: (_, index) => (index % 2 ? 'is-even' : undefined),
    },
} satisfies Record<string, LaneDefinition>;

export type LaneId = keyof typeof laneDefinitions;

export type LaneBlock = {
    id: string;
    lane: LaneId;
    section: SectionProps;
    start: RouteProgressAtPoint;
    end: RouteProgressAtPoint;
    label: string;
    /** A modifier class: how bad the traffic is, or which country of an alternating pair. */
    tone?: string;
};

export type Lane = ChipLook & { id: LaneId; blocks: LaneBlock[] };

export const laneLook = (id: LaneId): ChipLook => ({ label: laneDefinitions[id].label, icon: roadIcons[id] });

/** Which of these lanes the route has sections for. */
export const lanesCrossed = (route: Route, ids: readonly LaneId[]): LaneId[] =>
    ids.filter((id) => laneDefinitions[id].sections(route.properties.sections)?.length);

const lanesOfRoute = new WeakMap<Route, Lane[]>();

/**
 * The lanes the route has sections for, worked out once per route: a pointer moving along the route
 * asks on every move.
 */
export const routeLanes = (route: Route): Lane[] => {
    const cached = lanesOfRoute.get(route);
    if (cached) return cached;

    const lanes = keysOf(laneDefinitions).flatMap((id) => {
        const definition: LaneDefinition = laneDefinitions[id];
        const blocks = (definition.sections(route.properties.sections) ?? []).flatMap((section, index) => {
            const progress = getRouteProgressForSection(route, section);
            if (!progress) return [];

            return [
                {
                    id: section.id,
                    lane: id,
                    section,
                    start: progress.start,
                    end: progress.end,
                    label: definition.blockLabel(section, index),
                    tone: definition.tone?.(section, index),
                },
            ];
        });
        return blocks.length ? [{ id, ...laneLook(id), blocks }] : [];
    });
    lanesOfRoute.set(route, lanes);
    return lanes;
};

/** The section of one of `ids` at a distance along the route, from the lane listed first. */
export const sectionAt = (route: Route, distanceInMeters: number, ids: readonly LaneId[]): LaneBlock | undefined =>
    routeLanes(route)
        .filter((lane) => ids.includes(lane.id))
        .flatMap((lane) => lane.blocks)
        .find(
            ({ start, end }) => start.distanceInMeters <= distanceInMeters && distanceInMeters <= end.distanceInMeters,
        );

/** When the trip reaches a stop and when it leaves again: the same point, apart by the stay. */
export type StopMark = { arrive: RouteProgressAtPoint; leave: RouteProgressAtPoint };

export const stopMarks = (route: Route): StopMark[] =>
    route.properties.sections.leg.reduce<StopMark[]>(
        (marks, { summary }) => {
            const { leave } = marks[marks.length - 1];
            const arrive = {
                distanceInMeters: leave.distanceInMeters + summary.lengthInMeters,
                travelTimeInSeconds: leave.travelTimeInSeconds + summary.travelTimeInSeconds,
            };
            const stay = summary.stopTimeInSeconds ?? 0;
            return [...marks, { arrive, leave: { ...arrive, travelTimeInSeconds: arrive.travelTimeInSeconds + stay } }];
        },
        [
            {
                arrive: { distanceInMeters: 0, travelTimeInSeconds: 0 },
                leave: { distanceInMeters: 0, travelTimeInSeconds: 0 },
            },
        ],
    );

/** Where a point of the route sits along the bar, from 0 to 1. */
export const axisFraction = (route: Route, axis: Axis, progress: RouteProgressAtPoint): number => {
    const { lengthInMeters, travelTimeInSeconds } = route.properties.summary;
    const fraction =
        axis === 'distance'
            ? progress.distanceInMeters / lengthInMeters
            : progress.travelTimeInSeconds / travelTimeInSeconds;
    return Math.min(1, Math.max(0, fraction));
};
