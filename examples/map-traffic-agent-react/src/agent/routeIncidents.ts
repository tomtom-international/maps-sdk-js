import { getSectionOverlap, type Routes, type TrafficIncident } from '@tomtom-org/maps-sdk/core';

type RouteFeature = Routes['features'][number];
type Sections = RouteFeature['properties']['sections'];
type RoadStretch = NonNullable<Sections['importantRoadStretch']>[number];

/**
 * Pull the incidents that lie ON the monitored corridors straight out of the route data:
 * every `sections.traffic` entry is a live-traffic incident on that alternative, and the
 * overlapping `importantRoadStretch` sections give it road numbers. Produces the same
 * `TrafficIncident` shape the area panels consume, so the KPI strip + triage panel render
 * route-monitor incidents exactly like area incidents. Incidents shared across alternatives
 * are de-duplicated so counts/aggregates aren't inflated.
 */
export const incidentsFromRoutes = (routeCollections: readonly Routes[]): TrafficIncident[] => {
    const out: TrafficIncident[] = [];
    const seen = new Set<string>();
    for (const collection of routeCollections) {
        for (const route of collection.features) {
            for (const incident of incidentsFromRoute(route)) {
                if (seen.has(incident.properties.id)) continue;
                seen.add(incident.properties.id);
                out.push(incident);
            }
        }
    }
    return out;
};

const incidentsFromRoute = (route: RouteFeature): TrafficIncident[] => {
    const coords = route.geometry?.type === 'LineString' ? route.geometry.coordinates : [];
    const sections = route.properties.sections;
    const traffic = sections?.traffic ?? [];
    const roadStretches = sections?.importantRoadStretch ?? [];

    return traffic.map((section) => {
        const start = section.startPointIndex ?? 0;
        const end = section.endPointIndex ?? start;
        const slice = coords.slice(start, Math.max(end + 1, start + 1));
        // The head road first, as the panels read `roadNumbers[0]` as the incident's road.
        const head = headRoad(roadStretches, start, end);
        const roadNumbers = head
            ? [head, ...roadsForRange(roadStretches, start, end).filter((road) => road !== head)]
            : roadsForRange(roadStretches, start, end);
        const incident: TrafficIncident = {
            type: 'Feature',
            geometry:
                slice.length >= 2
                    ? { type: 'LineString', coordinates: slice }
                    : { type: 'Point', coordinates: slice[0] ?? coords[start] ?? coords[0] ?? [0, 0] },
            properties: {
                id: '',
                category: section.categories?.[0] ?? 'unknown',
                magnitudeOfDelay: section.magnitudeOfDelay,
                delayInSeconds: section.delayInSeconds ?? 0,
                timeValidity: 'present',
                events: [],
                ...(roadNumbers.length > 0 && { roadNumbers }),
            },
        };
        // Keyed on what the incident is, not its position in the list, so a jam inserted ahead of it
        // on the next tick leaves its id (and the address looked up for it) in place.
        incident.properties.id = `route-${incidentKey(incident, head)}`;
        return incident;
    });
};

// Whether a stretch shares a segment with the incident's [start, end], or holds it when the incident is a
// single point: a stretch that only meets it at one end lies on another road.
const overlapsIncident = (stretch: RoadStretch, start: number, end: number): boolean => {
    const stretchStart = stretch.startPointIndex ?? 0;
    const stretchEnd = stretch.endPointIndex ?? stretchStart;
    if (start === end) return stretchStart <= start && start <= stretchEnd;
    return (
        getSectionOverlap(
            { startPointIndex: stretchStart, endPointIndex: stretchEnd },
            { startPointIndex: start, endPointIndex: end },
        ) !== undefined
    );
};

// Road numbers (falling back to street names) of every important-road-stretch section overlapping the
// incident's [start, end].
const roadsForRange = (stretches: readonly RoadStretch[], start: number, end: number): string[] => {
    const roads = new Set<string>();
    for (const stretch of stretches) {
        if (!overlapsIncident(stretch, start, end)) continue;
        const numbers = stretch.roadNumbers ?? [];
        if (numbers.length > 0) {
            for (const number of numbers) roads.add(number);
        } else if (stretch.streetName) {
            roads.add(stretch.streetName);
        }
    }
    return [...roads];
};

// The road nearest the incident's head: of the stretches overlapping its [start, end], the one starting
// last. A queue that grows upstream onto another road overlaps more stretches, but none nearer its head.
const headRoad = (stretches: readonly RoadStretch[], start: number, end: number): string => {
    let head: RoadStretch | undefined;
    for (const stretch of stretches) {
        if (!overlapsIncident(stretch, start, end)) continue;
        if (!head || (stretch.startPointIndex ?? 0) > (head.startPointIndex ?? 0)) head = stretch;
    }
    return head?.roadNumbers?.[0] ?? head?.streetName ?? '';
};

// Keyed on the incident's head, the bottleneck end of the section, and the road there, which stay put
// while a queue grows upstream from it.
const incidentKey = (incident: TrafficIncident, road: string): string => {
    const point =
        incident.geometry.type === 'LineString'
            ? (incident.geometry.coordinates.at(-1) ?? incident.geometry.coordinates[0])
            : incident.geometry.coordinates;
    return `${incident.properties.category}:${road}:${point[0].toFixed(3)},${point[1].toFixed(3)}`;
};
