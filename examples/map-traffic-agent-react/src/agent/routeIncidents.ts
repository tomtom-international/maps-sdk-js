import type { Routes, TrafficIncident } from '@tomtom-org/maps-sdk/core';

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
                const key = dedupeKey(incident);
                if (seen.has(key)) continue;
                seen.add(key);
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
    const routeIndex = route.properties.index;

    return traffic.map((section, i) => {
        const start = section.startPointIndex ?? 0;
        const end = section.endPointIndex ?? start;
        const slice = coords.slice(start, Math.max(end + 1, start + 1));
        const roadNumbers = roadsForRange(roadStretches, start, end);
        return {
            type: 'Feature',
            geometry:
                slice.length >= 2
                    ? { type: 'LineString', coordinates: slice }
                    : { type: 'Point', coordinates: slice[0] ?? coords[start] ?? coords[0] ?? [0, 0] },
            properties: {
                id: `route-${routeIndex}-traffic-${i}`,
                category: section.categories?.[0] ?? 'unknown',
                magnitudeOfDelay: section.magnitudeOfDelay,
                delayInSeconds: section.delayInSeconds ?? 0,
                timeValidity: 'present',
                events: [],
                ...(roadNumbers.length > 0 && { roadNumbers }),
            },
        };
    });
};

// Road numbers (falling back to street names) of every important-road-stretch section whose
// point range overlaps the incident's [start, end].
const roadsForRange = (stretches: readonly RoadStretch[], start: number, end: number): string[] => {
    const roads = new Set<string>();
    for (const stretch of stretches) {
        const stretchStart = stretch.startPointIndex ?? 0;
        const stretchEnd = stretch.endPointIndex ?? stretchStart;
        if (stretchEnd < start || stretchStart > end) continue;
        const numbers = stretch.roadNumbers ?? [];
        if (numbers.length > 0) {
            for (const number of numbers) roads.add(number);
        } else if (stretch.streetName) {
            roads.add(stretch.streetName);
        }
    }
    return [...roads];
};

const dedupeKey = (incident: TrafficIncident): string => {
    const point =
        incident.geometry.type === 'LineString' ? incident.geometry.coordinates[0] : incident.geometry.coordinates;
    const road = incident.properties.roadNumbers?.[0] ?? '';
    return `${incident.properties.category}:${road}:${point[0].toFixed(3)},${point[1].toFixed(3)}`;
};
