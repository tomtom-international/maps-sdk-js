import type { HasLngLat } from '@cet/maps-sdk-js/core';
import type { CommonRoutingParams, CommonServiceParams, DepartArriveParams } from '../../shared';
import type { ReachableRangeResponseAPI } from './apiResponseTypes';

export const budgetTypes = [
    'timeMinutes',
    'remainingChargeCPT',
    'spentChargePCT',
    'spentFuelLiters',
    'distanceKM',
] as const;

/**
 * Type of budget constraint for reachable range calculation.
 *
 * @remarks
 * **Budget Types:**
 * - `timeMinutes`: Travel time in minutes (isochrone)
 * - `distanceKM`: Travel distance in kilometers (isodistance)
 * - `remainingChargeCPT`: Remaining battery charge in percentage (EV)
 * - `spentChargePCT`: Battery charge consumed in percentage (EV)
 * - `spentFuelLiters`: Fuel consumed in liters (combustion)
 *
 * **Common Use Cases:**
 * - Time: "Where can I reach in 30 minutes?"
 * - Distance: "What's within 10 km?"
 * - EV charge: "How far can I go on 50% battery?"
 * - Fuel: "Range with 20 liters of fuel"
 *
 * @example
 * ```typescript
 * const timeType: BudgetType = 'timeMinutes';
 * const distanceType: BudgetType = 'distanceKM';
 * const evType: BudgetType = 'remainingChargeCPT';
 * ```
 *
 * @group Reachable Range
 * @category Types
 */
export type BudgetType = (typeof budgetTypes)[number];

/**
 * Budget constraint for reachable range calculation.
 *
 * Defines the limit (time, distance, or fuel/charge) for calculating
 * how far you can travel from a starting point.
 *
 * @remarks
 * **Use Cases:**
 * - Service area visualization (30-min delivery zone)
 * - EV range anxiety mitigation (show reachable area)
 * - Emergency response coverage (10-min response time)
 * - Delivery zone planning
 * - Store location analysis
 *
 * @example
 * ```typescript
 * // 30-minute travel time
 * const timeBudget: ReachableRangeBudget = {
 *   type: 'timeMinutes',
 *   value: 30
 * };
 *
 * // 50 km distance
 * const distanceBudget: ReachableRangeBudget = {
 *   type: 'distanceKM',
 *   value: 50
 * };
 *
 * // 50% battery remaining
 * const evBudget: ReachableRangeBudget = {
 *   type: 'remainingChargeCPT',
 *   value: 50
 * };
 *
 * // 20 liters of fuel
 * const fuelBudget: ReachableRangeBudget = {
 *   type: 'spentFuelLiters',
 *   value: 20
 * };
 * ```
 *
 * @group Reachable Range
 * @category Types
 */
export type ReachableRangeBudget = {
    /**
     * The type of budget, including units.
     *
     * @remarks
     * - `timeMinutes`: Minutes of travel time
     * - `distanceKM`: Kilometers of travel distance
     * - `remainingChargeCPT`: Battery percentage remaining
     * - `spentChargePCT`: Battery percentage consumed
     * - `spentFuelLiters`: Liters of fuel consumed
     */
    type: BudgetType;

    /**
     * The value of the budget based on the units mentioned in the type.
     *
     * @remarks
     * **Typical Values:**
     * - Time: 5-60 minutes
     * - Distance: 5-100 km
     * - Charge: 10-100 percentage
     * - Fuel: 5-50 liters
     *
     * @example
     * ```typescript
     * value: 30    // 30 minutes/km/percent/liters depending on type
     * value: 15.5  // Decimal values supported
     * ```
     */
    value: number;
};

/**
 * Parameters specific to reachable range calculation.
 *
 * @remarks
 * These parameters are combined with common routing parameters to calculate
 * the reachable area from a starting point.
 *
 * @group Reachable Range
 * @category Types
 */
export type ReachableRangeOwnParams = {
    /**
     * Location from which the range calculation should start.
     *
     * @remarks
     * The center point from which reachability is calculated. Can be:
     * - An object with `lon` and `lat` properties
     * - An array `[longitude, latitude]`
     *
     * @example
     * ```typescript
     * // Object format
     * origin: { lon: 4.9, lat: 52.3 }
     *
     * // Array format
     * origin: [4.9, 52.3]
     * ```
     */
    origin: HasLngLat;

    /**
     * The budget for the reachable range calculation.
     *
     * @remarks
     * Consists of a type indicating whether it's about time, distance, or
     * fuel/charge and the units, plus its value.
     *
     * Determines the extent of the reachable area polygon.
     */
    budget: ReachableRangeBudget;

    /**
     * Maximum ferry length in meters to consider.
     *
     * @remarks
     * Ferries longer than this value will be avoided in the calculation.
     * Useful for excluding long ferry routes that might extend the range
     * unrealistically.
     *
     * @example
     * ```typescript
     * maxFerryLengthMeters: 5000  // Avoid ferries longer than 5 km
     * ```
     */
    maxFerryLengthMeters?: number;

    /**
     * Specifies when to depart.
     *
     * @remarks
     * If past dates are supplied or dates that are impossible to achieve,
     * it will default to departing now.
     *
     * **Traffic Impact:**
     * - Future departure times use predictive traffic
     * - Current time uses live traffic
     * - Historic times use historical patterns
     *
     * @default Depart now
     *
     * @example
     * ```typescript
     * when: { departAt: new Date('2025-10-20T08:00:00Z') }
     * when: { departAt: 'now' }
     * ```
     */
    when?: DepartArriveParams<'departAt'>;
};

/**
 * Complete parameters for calculating a reachable range.
 *
 * Combines common service parameters, routing parameters, and reachable range
 * specific options to compute an isochrone or isodistance polygon.
 *
 * @remarks
 * **What it Returns:**
 * A polygon representing the area reachable from the origin within the
 * specified budget (time, distance, or fuel/charge).
 *
 * **Use Cases:**
 * - Delivery zone visualization
 * - Service area mapping
 * - Emergency response coverage
 * - EV range display
 * - Store catchment areas
 * - Real estate search (30-min commute)
 *
 * **Traffic Consideration:**
 * Results vary based on departure time and traffic conditions. Use
 * appropriate `when` values for accurate predictions.
 *
 * @example
 * ```typescript
 * // 30-minute driving range
 * const params: ReachableRangeParams = {
 *   key: 'your-api-key',
 *   origin: [4.9, 52.3],
 *   budget: {
 *     type: 'timeMinutes',
 *     value: 30
 *   },
 *   routeType: 'fastest',
 *   traffic: 'live',
 *   when: { departAt: 'now' }
 * };
 *
 * // 50 km distance range
 * const distanceParams: ReachableRangeParams = {
 *   key: 'your-api-key',
 *   origin: [4.9, 52.3],
 *   budget: {
 *     type: 'distanceKM',
 *     value: 50
 *   }
 * };
 *
 * // EV range with 50% battery
 * const evParams: ReachableRangeParams = {
 *   key: 'your-api-key',
 *   origin: [4.9, 52.3],
 *   budget: {
 *     type: 'remainingChargeCPT',
 *     value: 50
 *   },
 *   vehicle: {
 *     engineType: 'electric',
 *     model: {
 *       engine: {
 *         consumption: {
 *           charging: { maxChargeKWH: 100 }
 *         }
 *       }
 *     },
 *     state: {
 *       currentChargePCT: 80
 *     }
 *   }
 * };
 *
 * // Avoid toll roads
 * const noTollParams: ReachableRangeParams = {
 *   key: 'your-api-key',
 *   origin: [4.9, 52.3],
 *   budget: {
 *     type: 'timeMinutes',
 *     value: 45
 *   },
 *   avoid: ['tollRoads']
 * };
 * ```
 *
 * @group Reachable Range
 * @category Types
 */
export type ReachableRangeParams = CommonServiceParams<URL, ReachableRangeResponseAPI> &
    CommonRoutingParams &
    ReachableRangeOwnParams;
