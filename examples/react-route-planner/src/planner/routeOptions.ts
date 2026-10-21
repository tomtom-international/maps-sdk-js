import type { Avoidable } from '@tomtom-org/maps-sdk/core';
import type {
    ArrivalSide,
    CalculateRouteParams,
    DepartArriveParams,
    RouteType,
    TollTransponder,
} from '@tomtom-org/maps-sdk/services';
import { Gauge, Ruler, Spline, Sprout } from 'lucide-react';
import type { ChipLook } from '../panel/fields';
import { roadIcons } from '../panel/icons';

/** A departure or arrival as an instant, which is what the panel's `datetime-local` input picks. */
export type InstantWhen = Extract<DepartArriveParams, { date: Date }>;

/** The trip-wide options the panel edits, in the shape `calculateRoute` takes them. */
export type RouteOptions = Pick<
    CalculateRouteParams,
    'costModel' | 'vehicle' | 'maxAlternatives' | 'arrivalSide' | 'useEntryPoints' | 'computeTravelTimeFor'
> & { when?: InstantWhen };

export const defaultRouteOptions: RouteOptions = {
    costModel: { routeType: 'fast', traffic: 'live' },
    maxAlternatives: 1,
};

export const routeTypeLooks: Record<RouteType, ChipLook> = {
    fast: { label: 'Fastest', icon: Gauge },
    short: { label: 'Shortest', icon: Ruler },
    efficient: { label: 'Eco', icon: Sprout },
    thrilling: { label: 'Curvy', icon: Spline },
};

export const avoidLooks: Record<Avoidable, ChipLook> = {
    tollRoads: { label: 'Tolls', icon: roadIcons.toll },
    motorways: { label: 'Motorways', icon: roadIcons.motorway },
    ferries: { label: 'Ferries', icon: roadIcons.ferry },
    unpavedRoads: { label: 'Unpaved', icon: roadIcons.unpaved },
    carpools: { label: 'Carpool lanes', icon: roadIcons.carpool },
    alreadyUsedRoads: { label: 'Roads used twice', icon: roadIcons.repeat },
    borderCrossings: { label: 'Borders', icon: roadIcons.country },
    tunnels: { label: 'Tunnels', icon: roadIcons.tunnel },
    carTrains: { label: 'Car trains', icon: roadIcons.carTrain },
    lowEmissionZones: { label: 'Low-emission zones', icon: roadIcons.lowEmissionZone },
};

export const arrivalSideLabels: Record<ArrivalSide, string> = {
    any: 'Either side of the road',
    curb: 'The curb side',
};

export const tollTransponderLabels: Record<TollTransponder, string> = {
    unknown: 'Not specified',
    all: 'Carries a transponder',
    none: 'No transponder',
};
