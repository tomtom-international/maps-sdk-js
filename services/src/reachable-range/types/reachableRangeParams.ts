import type { HasLngLat } from '@anw/maps-sdk-js/core';
import type { CommonRoutingParams, CommonServiceParams, DepartArriveParams } from '../../shared';
import type { ReachableRangeResponseAPI } from './apiResponseTypes';

export const budgetTypes = [
    'timeMinutes',
    'remainingChargeCPT',
    'spentChargePCT',
    'spentFuelLiters',
    'distanceKM',
] as const;

export type BudgetType = (typeof budgetTypes)[number];

export type ReachableRangeBudget = {
    /**
     * The type of budget, including units (time in minutes, distance in kilometers, charge in battery percentages, fuel in liters).
     */
    type: BudgetType;
    /**
     * The value of the budget based on the units mentioned in the type.
     */
    value: number;
};

export type ReachableRangeOwnParams = {
    /**
     *  Location from which the range calculation should start, as a GeoJSON lng-lat position.
     */
    origin: HasLngLat;
    /**
     * The budget for the reachable range calculation.
     * * Consists of a type indicating whether it's about time, distance, or fuel/charge and the units, and its value.
     */
    budget: ReachableRangeBudget;
    maxFerryLengthMeters?: number;
    /**
     * Specifies when to depart.
     * If past dates are supplied or in a way that are impossible to achieve then it will default to departing now.
     * @default depart now
     */
    when?: DepartArriveParams<'departAt'>;
};

export type ReachableRangeParams = CommonServiceParams<URL, ReachableRangeResponseAPI> &
    CommonRoutingParams &
    ReachableRangeOwnParams;
