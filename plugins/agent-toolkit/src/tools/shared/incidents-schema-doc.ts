/**
 * @module agent-toolkit-tools
 *
 * Compact schema documentation for the `TrafficIncident` shape, reused by every tool whose
 * LLM-authored code reads the injected `incidents` array (`analyseData`, `processData`,
 * `clusterIncidents`). Without this the model invents fields (e.g. `reportedDelayInSeconds`) or
 * forgets the `properties` nesting — every documented field below is read off `feature.properties`.
 */

/** @ignore */
export const INCIDENTS_SCHEMA_DOC =
    '`incidents` is a flat array of TrafficIncident Features (geometry is `Point` OR `LineString` — guard ' +
    'with `feature.geometry.type` before line-only ops). All fields below live on `feature.properties`:\n' +
    '```ts\n' +
    'type TrafficIncidentProperties = {\n' +
    '  id: string;\n' +
    '  category: TrafficIncidentCategory;   // "jam" | "accident" | "roadworks" | "road-closed" | "lane-closed" | "broken-down-vehicle" | "danger" | "flooding" | "fog" | "frost" | "rain" | "wind" | "other"\n' +
    '  magnitudeOfDelay: "unknown" | "minor" | "moderate" | "major" | "undefined";  // severity\n' +
    '  delayInSeconds?: number;             // delay caused by the incident (NOT every incident has one — guard with ?? 0)\n' +
    '  lengthInMeters?: number;             // affected road length\n' +
    '  roadNumbers?: string[];              // e.g. ["M25", "A1"]\n' +
    '  from?: string; to?: string;          // human-readable start / end of the affected stretch\n' +
    '  timeValidity: "present" | "future";\n' +
    '  events: Array<{ description: string; code?: number; iconCategory?: number }>;\n' +
    '  startTime?: Date; endTime?: Date; lastReportTime?: Date;\n' +
    '  probabilityOfOccurrence?: string; numberOfReports?: number;\n' +
    '};\n' +
    '```\n' +
    'Read everything off `properties` — there is NO `reportedDelayInSeconds` / top-level delay field ' +
    '(e.g. `properties.delayInSeconds`, guard `?? 0`).';
