/**
 * Common summary type for a route or route leg.
 * Contains departure/arrival times, lengths and durations.
 */
export type Summary = {
    /**
     * The arrival time at the end of the route or leg.
     */
    arrivalTime: Date;
    /**
     * The departure time from the beginning of the route or leg.
     */
    departureTime: Date;
    /**
     * The length of the route or leg in meters.
     */
    lengthInMeters: number;
    /**
     * The estimated travel time in seconds for the route or leg.
     * Note that even when considerTraffic=false, travelTimeInSeconds still includes the delay due to traffic.
     */
    travelTimeInSeconds: number;
    /**
     * The delay in seconds compared to free-flow conditions according to real-time traffic information.
     */
    trafficDelayInSeconds: number;
    /**
     * The portion of the route or leg, expressed in meters, that is affected by traffic events which cause the delay.
     */
    trafficLengthInMeters: number;
    /**
     * The estimated travel time in seconds
     * calculated as if there are no delays on the route due to traffic conditions (e.g., congestion).
     * Included if requested using the computeTravelTimeFor parameter.
     */
    noTrafficTravelTimeInSeconds?: number;
    /**
     * The estimated travel time in seconds calculated using time-dependent historic traffic data.
     * In other words, the expected travel time considering the predicted traffic at the requested time.
     * Included if requested using the computeTravelTimeFor parameter.
     */
    historicTrafficTravelTimeInSeconds?: number;
    /**
     * The estimated travel time in seconds calculated using real-time speed data.
     * Included if requested using the computeTravelTimeFor parameter.
     */
    liveTrafficIncidentsTravelTimeInSeconds?: number;
};
