/**
 * @module agent-toolkit-tools
 *
 * Compact schema documentation for the `Route` properties shape, reused by
 * every tool whose LLM-authored code reads a Routes FeatureCollection
 * (`analyseData`, `processData`) — injected per entry as `routesByEntry[id]`.
 * Only the non-GeoJSON-standard bits are spelled out — `Route` is a LineString Feature.
 */

/** @ignore */
export const ROUTES_SCHEMA_DOC =
    'Each `routesByEntry[id]` is a FeatureCollection of LineString Features (each route has `feature.bbox`). `Route.properties` shape:\n' +
    '```ts\n' +
    'type RouteProperties = {\n' +
    '  index: number; // 0 = main route, 1+ = alternatives\n' +
    '  summary: {\n' +
    '    lengthInMeters: number;\n' +
    '    travelTimeInSeconds: number;       // includes traffic delay\n' +
    '    noTrafficTravelTimeInSeconds?: number;\n' +
    '    trafficDelayInSeconds: number;\n' +
    '    trafficLengthInMeters: number;\n' +
    '    departureTime: Date; arrivalTime: Date;\n' +
    '    // EV-only:\n' +
    '    batteryConsumptionInkWh?: number; batteryConsumptionInPCT?: number;\n' +
    '    remainingChargeAtArrivalInkWh?: number; remainingChargeAtArrivalInPCT?: number;\n' +
    '    totalChargingTimeInSeconds?: number;\n' +
    '    // Combustion-only:\n' +
    '    fuelConsumptionInLiters?: number;\n' +
    '  };\n' +
    '  // Segments grouped by characteristic. Every section has { id, startPointIndex, endPointIndex }\n' +
    '  // unless noted; *Index values reference `geometry.coordinates`.\n' +
    '  sections: {\n' +
    '    leg: Array<{ id; startPointIndex?; endPointIndex?; summary: RouteSummary }>; // ALWAYS present; one per non-circle waypoint pair\n' +
    '    country?: Array<{ id; startPointIndex; endPointIndex; countryCodeISO3: string }>;       // ISO 3166-1 alpha-3\n' +
    '    tollVignette?: Array<{ id; startPointIndex; endPointIndex; countryCodeISO3: string }>;\n' +
    '    traffic?: Array<{\n' +
    '      id; startPointIndex; endPointIndex;\n' +
    '      categories: TrafficIncidentCategory[];   // e.g. "Jam","Accident","RoadWorks","Closure"\n' +
    '      magnitudeOfDelay: "Unknown"|"Minor"|"Moderate"|"Major"|"Undefined";\n' +
    '      tec: { effectCode?: number; causes?: Array<{ mainCauseCode: number; subCauseCode?: number }> };\n' +
    '      effectiveSpeedInKmh?: number;\n' +
    '      delayInSeconds?: number;\n' +
    '    }>;\n' +
    '    importantRoadStretch?: Array<{ id; startPointIndex; endPointIndex; index: number; streetName?: string; roadNumbers?: string[] }>;\n' +
    '    lanes?: Array<{\n' +
    '      id; startPointIndex; endPointIndex;\n' +
    '      lanes: Array<{ directions: PossibleLaneDirection[]; follow?: PossibleLaneDirection }>;\n' +
    '      laneSeparators: PossibleLaneSeparator[];\n' +
    '      properties?: string[];                   // e.g. "IS_MANEUVER"\n' +
    '    }>;\n' +
    '    speedLimit?: Array<{ id; startPointIndex; endPointIndex; maxSpeedLimitInKmh: number }>;\n' +
    '    roadShields?: Array<{ id; startPointIndex; endPointIndex; roadShieldReferences: RoadShieldReference[] }>;\n' +
    '    // Plain section ranges (id + startPointIndex + endPointIndex only):\n' +
    '    ferry?: SectionProps[]; motorway?: SectionProps[]; toll?: SectionProps[]; tunnel?: SectionProps[];\n' +
    '    unpaved?: SectionProps[]; urban?: SectionProps[]; pedestrian?: SectionProps[];\n' +
    '    carpool?: SectionProps[]; carTrain?: SectionProps[];\n' +
    '    lowEmissionZone?: SectionProps[]; vehicleRestricted?: SectionProps[];\n' +
    '  };\n' +
    '  progress?: Array<{ pointIndex: number; travelTimeInSeconds?: number; distanceInMeters?: number }>; // cumulative milestones\n' +
    '  guidance?: { instructions: Array<{ pointIndex: number; maneuver: string; street?: string; message?: string }> };\n' +
    '};\n' +
    '```\n' +
    '`pointIndex` values reference positions in `geometry.coordinates`. Guard `?` fields with `?.` / `??`. ' +
    'For "how long / how far" questions, use `summary.lengthInMeters` / `summary.travelTimeInSeconds`.';
