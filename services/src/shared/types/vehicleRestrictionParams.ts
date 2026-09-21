/**
 * Whether the vehicle carries an electronic toll collection transponder.
 *
 * Determines which toll roads the routing engine may use: some tolls can only be paid by
 * transponder, others only without one.
 *
 * @group Vehicle
 */
export const tollTransponderOptions = ['all', 'unknown', 'none'] as const;

/**
 * Whether the vehicle carries an electronic toll collection transponder.
 *
 * @remarks
 * - `all` — the vehicle has a transponder accepted by every toll operator on the route
 * - `unknown` — transponder availability is unknown, so no assumption is made
 * - `none` — the vehicle has no transponder
 *
 * @example
 * ```typescript
 * const transponder: TollTransponder = 'all';
 * ```
 *
 * @group Vehicle
 */
export type TollTransponder = (typeof tollTransponderOptions)[number];

/**
 * Parameters for a vehicle which are related to restrictions applied during route planning.
 */
export type VehicleRestrictions = {
    /**
     * Vehicle restrictions applied during route planning.
     */
    restrictions?: {
        /**
         * Maximum speed of the vehicle in kilometers/hour.
         * * Must have a value in the range [0, 250].
         * * A value of 0 means that an appropriate value for the vehicle will be determined and applied during route planning.
         *
         * @default 0
         */
        maxSpeedKMH?: number;

        /**
         * Whether the vehicle carries an electronic toll collection transponder.
         *
         * @remarks
         * Affects which toll roads are considered usable: a toll that can only be paid by
         * transponder is avoided when this is `none`, and a toll that cannot be paid by
         * transponder is avoided when this is `all`.
         *
         * @default 'unknown'
         *
         * @example
         * ```typescript
         * restrictions: {
         *   tollTransponder: 'all'
         * }
         * ```
         */
        tollTransponder?: TollTransponder;
    };
};
