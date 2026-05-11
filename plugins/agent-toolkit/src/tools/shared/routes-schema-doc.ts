/**
 * @module agent-toolkit-tools
 *
 * Compact TypeScript-like schema documentation for the `Route` / `Routes`
 * shape, reused by every tool whose LLM-authored code reads or returns a
 * Routes FeatureCollection (e.g. analyseRoutes). Keep it terse: it becomes
 * part of the tool description prompt on every call.
 */

/** @ignore */
export const ROUTES_SCHEMA_DOC =
    'Schema (the full `Route` / `Routes` shape you can rely on):\n' +
    '```ts\n' +
    'type Routes = { type: "FeatureCollection"; features: Route[]; bbox?: [minLng, minLat, maxLng, maxLat]; properties?: { requestId?: string; calculatedAt?: Date } };\n' +
    'type Route = {\n' +
    '  type: "Feature";\n' +
    '  id: string;\n' +
    '  geometry: { type: "LineString"; coordinates: [lng, lat][] };\n' +
    '  bbox: [minLng, minLat, maxLng, maxLat];\n' +
    '  properties: {\n' +
    '    index: number; // 0 = main route, 1+ = alternatives\n' +
    '    summary: {\n' +
    '      lengthInMeters: number;\n' +
    '      travelTimeInSeconds: number;       // includes traffic delay\n' +
    '      noTrafficTravelTimeInSeconds?: number; // free-flow estimate\n' +
    '      trafficDelayInSeconds: number;\n' +
    '      trafficLengthInMeters: number;\n' +
    '      departureTime: Date; arrivalTime: Date;\n' +
    '      // EV-only (when applicable):\n' +
    '      batteryConsumptionInkWh?: number; batteryConsumptionInPCT?: number;\n' +
    '      remainingChargeAtArrivalInkWh?: number; remainingChargeAtArrivalInPCT?: number;\n' +
    '      totalChargingTimeInSeconds?: number;\n' +
    '      // Combustion-only:\n' +
    '      fuelConsumptionInLiters?: number;\n' +
    '    };\n' +
    '    sections: { // segments of the route grouped by characteristic. Every entry has { id, startPointIndex, endPointIndex } unless noted; *Index values reference `geometry.coordinates`.\n' +
    '      leg: Array<{ id; startPointIndex?; endPointIndex?; summary: RouteSummary }>; // ALWAYS present; one per non-circle waypoint pair\n' +
    '      country?: Array<{ id; startPointIndex; endPointIndex; countryCodeISO3: string }>;       // ISO 3166-1 alpha-3 — "USA","NLD","DEU"\n' +
    '      tollVignette?: Array<{ id; startPointIndex; endPointIndex; countryCodeISO3: string }>;  // same shape as country\n' +
    '      traffic?: Array<{\n' +
    '        id; startPointIndex; endPointIndex;\n' +
    '        categories: TrafficIncidentCategory[];   // e.g. "Jam","Accident","RoadWorks","Closure"\n' +
    '        magnitudeOfDelay: "Unknown"|"Minor"|"Moderate"|"Major"|"Undefined";\n' +
    '        tec: { effectCode?: number; causes?: Array<{ mainCauseCode: number; subCauseCode?: number }> };\n' +
    '        effectiveSpeedInKmh?: number;            // actual avg speed through the incident\n' +
    '        delayInSeconds?: number;                 // extra time vs free-flow\n' +
    '      }>;\n' +
    '      importantRoadStretch?: Array<{ id; startPointIndex; endPointIndex; index: number; streetName?: string; roadNumbers?: string[] }>;\n' +
    '      lanes?: Array<{\n' +
    '        id; startPointIndex; endPointIndex;\n' +
    '        lanes: Array<{ directions: PossibleLaneDirection[]; follow?: PossibleLaneDirection }>;\n' +
    '        laneSeparators: PossibleLaneSeparator[];\n' +
    '        properties?: string[];                   // e.g. "IS_MANEUVER"\n' +
    '      }>;\n' +
    '      speedLimit?: Array<{ id; startPointIndex; endPointIndex; maxSpeedLimitInKmh: number }>;\n' +
    '      roadShields?: Array<{ id; startPointIndex; endPointIndex; roadShieldReferences: RoadShieldReference[] }>;\n' +
    '      // Plain section ranges (id + startPointIndex + endPointIndex only):\n' +
    '      ferry?: SectionProps[]; motorway?: SectionProps[]; toll?: SectionProps[]; tunnel?: SectionProps[];\n' +
    '      unpaved?: SectionProps[]; urban?: SectionProps[]; pedestrian?: SectionProps[];\n' +
    '      carpool?: SectionProps[]; carTrain?: SectionProps[];\n' +
    '      lowEmissionZone?: SectionProps[]; vehicleRestricted?: SectionProps[];\n' +
    '    };\n' +
    '    progress?: Array<{ pointIndex: number; travelTimeInSeconds?: number; distanceInMeters?: number }>; // cumulative milestones along the geometry\n' +
    '    guidance?: { instructions: Array<{ pointIndex: number; maneuver: string; street?: string; message?: string }> }; // turn-by-turn (when requested)\n' +
    '  };\n' +
    '};\n' +
    '```\n' +
    'Notes: coordinates are [lng, lat] (GeoJSON order). `pointIndices` reference positions in `geometry.coordinates`. ' +
    'Fields marked `?` may be undefined — guard with optional chaining. Use `summary.lengthInMeters` / `summary.travelTimeInSeconds` for "how long / how far" questions.';
