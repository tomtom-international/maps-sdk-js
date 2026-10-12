import { findBestWaypointInsertionIndex, type Place, type Route } from '@tomtom-org/maps-sdk/core';
import type { PlanningWaypoint } from '@tomtom-org/maps-sdk/map';
import type { LegCostModel } from '@tomtom-org/maps-sdk/services';
import { useReducer } from 'react';

/** One row of the planner: a place, or an empty slot the search fills. */
export type Stop = {
    id: string;
    place?: Place;
    /** The wait once there. The API takes none on the origin or the destination. */
    pauseDurationSeconds: number;
    /** How to drive the leg that arrives here. Ignored on the origin. */
    legCostModel: LegCostModel;
};

export type StopsAction =
    | { type: 'replace'; stops: Stop[] }
    | { type: 'fill'; id: string; place: Place }
    | { type: 'insert'; index: number; stop: Stop }
    | { type: 'remove'; id: string }
    | { type: 'move'; from: number; to: number }
    | { type: 'reverse' }
    | { type: 'update'; id: string; changes: Partial<Pick<Stop, 'pauseDurationSeconds' | 'legCostModel'>> };

let nextStopId = 0;

export const createStop = (place?: Place, pauseDurationSeconds = 0): Stop => ({
    id: `stop-${nextStopId++}`,
    place,
    pauseDurationSeconds,
    legCostModel: {},
});

export const emptyStops = (): Stop[] => [createStop(), createStop()];

const stopsReducer = (stops: Stop[], action: StopsAction): Stop[] => {
    switch (action.type) {
        case 'replace':
            return action.stops;
        case 'fill':
            return stops.map((stop) => (stop.id === action.id ? { ...stop, place: action.place } : stop));
        case 'insert':
            return stops.toSpliced(action.index, 0, action.stop);
        case 'remove':
            // A route needs two rows: below that, removing a place leaves its slot empty.
            return stops.length > 2
                ? stops.filter((stop) => stop.id !== action.id)
                : stops.map((stop) => (stop.id === action.id ? createStop() : stop));
        case 'move': {
            const moved = stops[action.from];
            return stops.toSpliced(action.from, 1).toSpliced(action.to, 0, moved);
        }
        case 'reverse':
            return stops.toReversed();
        case 'update':
            return stops.map((stop) => (stop.id === action.id ? { ...stop, ...action.changes } : stop));
    }
};

export const useStops = () => useReducer(stopsReducer, undefined, emptyStops);

/** The filled rows in route order, each with its row's index, which its badge and its pin number it by. */
export const filledStops = (stops: Stop[]) =>
    stops.flatMap((stop, index) => (stop.place ? [{ id: stop.id, place: stop.place, index }] : []));

/** The places of the filled rows, in route order. */
export const stopPlaces = (stops: Stop[]): Place[] => stops.flatMap((stop) => (stop.place ? [stop.place] : []));

/** A row by what it is to the trip, to name it in a sentence: "the start", "stop 2". */
export const stopRole = (index: number, count: number): string =>
    index === 0 ? 'the start' : index === count - 1 ? 'the destination' : `stop ${index}`;

/** What a row's badge reads. */
export const stopBadge = (index: number, count: number): string =>
    index === 0 ? 'A' : index === count - 1 ? 'B' : String(index);

/**
 * Where a picked place goes: the targeted empty slot, else the first empty one, else the cheapest
 * detour along the current route.
 */
export const addPlaceAction = (stops: Stop[], place: Place, route?: Route, targetId?: string): StopsAction => {
    const target = stops.find((stop) => stop.id === targetId && !stop.place) ?? stops.find((stop) => !stop.place);
    if (target) return { type: 'fill', id: target.id, place };

    const index = route ? findBestWaypointInsertionIndex(route, stopPlaces(stops), place) : stops.length - 1;
    return { type: 'insert', index, stop: createStop(place) };
};

const legCostModelOf = ({ routeType, avoid }: LegCostModel): LegCostModel | undefined =>
    routeType || avoid?.length ? { ...(routeType && { routeType }), ...(avoid?.length && { avoid }) } : undefined;

/**
 * The stops as the routing module draws them, one per row so the pins keep their numbers: an empty
 * slot is `null`. Each place carries its per-stop options in its properties, so the same waypoints,
 * minus the empty slots, are the `calculateRoute` locations.
 */
export const toPlanningWaypoints = (stops: Stop[]): PlanningWaypoint[] => {
    const first = stops.findIndex((stop) => stop.place);
    const last = stops.findLastIndex((stop) => stop.place);
    return stops.map(({ place, pauseDurationSeconds, legCostModel }, index) => {
        if (!place) return null;

        const waits = index > first && index < last && pauseDurationSeconds > 0;
        const legOptions = index > first ? legCostModelOf(legCostModel) : undefined;
        return {
            ...place,
            properties: {
                ...place.properties,
                ...(waits && { pauseDurationSeconds }),
                ...(legOptions && { legCostModel: legOptions }),
            },
        };
    });
};
