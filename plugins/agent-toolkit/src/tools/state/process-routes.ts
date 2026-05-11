/**
 * @module agent-toolkit-tools
 */

import {
    bboxFromGeoJSON,
    calculateProgressAtRoutePoint,
    getCoordinateAtRouteProgress,
    getProgressAtNearestRoutePoint,
    getRouteProgressBetween,
    getRouteProgressForSection,
    getSectionBBox,
    type Routes,
} from '@tomtom-org/maps-sdk/core';
import * as turf from '@turf/turf';
import * as h3 from 'h3-js';
import { z } from 'zod';
import type { ToolState } from '../../types';
import {
    applyFitOnMap,
    buildSandboxCodePrompt,
    FIT_ON_MAP_DOC,
    type FitOnMapInput,
    findPlacesByEntry,
    fittedReportSchema,
    isFitOnMapInput,
    PLACES_SCHEMA_DOC,
    placesEntryIDsSchema,
    ROUTES_SCHEMA_DOC,
    routesEntryIDsSchema,
    runSandboxedFn,
} from '../shared';
import { toolErrorSchema } from '../shared-output-schemas';

// `routeUtils` namespace injected into the sandbox. Bundled once at module load
// so each call is a stable reference (the LLM-visible API never shifts) and so
// future additions are a one-line change here.
const routeUtils = {
    bboxFromGeoJSON,
    calculateProgressAtRoutePoint,
    getCoordinateAtRouteProgress,
    getProgressAtNearestRoutePoint,
    getRouteProgressBetween,
    getRouteProgressForSection,
    getSectionBBox,
} as const;

const ROUTE_UTILS_DOC =
    '`routeUtils` (from @tomtom-org/maps-sdk/core):\n' +
    '• `getSectionBBox(route, section)` → `[W,S,E,N]`. Sections at `route.properties.sections.<type>` (`traffic`, `motorway`, `country`, `toll`, …).\n' +
    '• `getRouteProgressForSection(route, section)` / `getRouteProgressBetween(route, startPathIndex, endPathIndex)` → `{ start, end, delta: { distanceInMeters, travelTimeInSeconds } }`.\n' +
    '• `calculateProgressAtRoutePoint(route, pathIndex)` → `{ distanceInMeters, travelTimeInSeconds }`.\n' +
    '• `getCoordinateAtRouteProgress(route, query)` — `query`: `{ traveledDistanceInMeters }` | `{ traveledTimeInSeconds }` | `{ clockTime: Date }` → `{ position, ... }`.\n' +
    '• `getProgressAtNearestRoutePoint(route, { lng, lat })` — snap a point → projected position + cumulative distance/time.\n' +
    '• `bboxFromGeoJSON(featureOrCollection)` — bbox of any GeoJSON.';

/** Output schema for the process-routes tool. */
export const processRoutesOutputSchema = z.union([
    z.object({
        fitted: fittedReportSchema.describe('Bounds the camera was fit to.'),
    }),
    toolErrorSchema,
]);

/** Tool schema for process-routes. */
export const processRoutesSchema = z.object({
    routesEntryIDs: routesEntryIDsSchema({
        verb: 'process',
        extra: 'Multiple IDs are merged into a single `routes` input (features concatenated).',
    }),
    placesEntryIDs: placesEntryIDsSchema({
        verb: 'cross-reference',
        extra:
            'Optional. Injects `placesByEntry: Record<entryId, Places>` for correlating route sections/geometry ' +
            'with places (e.g. "fit the route AND every EV station within 500m").',
    }),
    code: z
        .string()
        .describe(
            'Async JS returning `{ fitOnMap }`. Read-only — no new entries. ' +
                'Derive section/progress bboxes via `routeUtils.*`; fall back to `turf.bbox(routes.features[0])` ' +
                'for the whole route.\n\n' +
                `${buildSandboxCodePrompt(['routes', 'placesByEntry', 'routeUtils', 'h3', 'turf'])}\n\n` +
                `${ROUTE_UTILS_DOC}\n\n` +
                `${FIT_ON_MAP_DOC}\n\n` +
                'Examples:\n' +
                '- focus on the worst traffic section: `const r = routes.features[0]; const sec = (r.properties.sections.traffic ?? []).slice().sort((a,b) => (b.delayInSeconds ?? 0) - (a.delayInSeconds ?? 0))[0]; const bbox = sec ? routeUtils.getSectionBBox(r, sec) : turf.bbox(r); return { fitOnMap: { bbox, padding: 80 } };`\n' +
                '- focus on the first toll section: `const r = routes.features[0]; const sec = r.properties.sections.toll?.[0]; if (!sec) return { fitOnMap: turf.bbox(r) }; return { fitOnMap: routeUtils.getSectionBBox(r, sec) };`\n' +
                '- focus on a 10–20 km segment: `const r = routes.features[0]; const a = routeUtils.getCoordinateAtRouteProgress(r, { traveledDistanceInMeters: 10000 }); const b = routeUtils.getCoordinateAtRouteProgress(r, { traveledDistanceInMeters: 20000 }); if (!a || !b) return { fitOnMap: turf.bbox(r) }; const fc = { type: "FeatureCollection", features: [turf.point(a.position), turf.point(b.position)] }; return { fitOnMap: { bbox: turf.bbox(fc), padding: 100 } };`\n' +
                '- focus on the first leg only: `const r = routes.features[0]; const leg = r.properties.sections.leg?.[0]; if (!leg) return { fitOnMap: turf.bbox(r) }; return { fitOnMap: routeUtils.getSectionBBox(r, leg) };`\n' +
                '- focus on a country-section + nearby EV stations (cross-ref): `const r = routes.features[0]; const sec = r.properties.sections.country?.find(c => c.countryCodeISO3 === "FRA"); if (!sec) return { fitOnMap: turf.bbox(r) }; const ev = (placesByEntry?.["ev-stations"]?.features ?? []).filter(p => turf.pointToLineDistance(p, r, { units: "meters" }) <= 1000); const fc = { type: "FeatureCollection", features: [...ev, turf.bboxPolygon(routeUtils.getSectionBBox(r, sec) ?? turf.bbox(r))] }; return { fitOnMap: { bbox: turf.bbox(fc), padding: 80 } };`\n\n' +
                `${ROUTES_SCHEMA_DOC}\n\n` +
                `${PLACES_SCHEMA_DOC}`,
        ),
});

export const processRoutesDescription =
    'Dynamic JS over routes entries: derive a bbox via `routeUtils` (sections, progress, snap-to-line) and fit ' +
    'the camera. Read-only. Code `(routes, placesByEntry, routeUtils, h3, turf) => { fitOnMap }`. ' +
    'Pass `placesEntryIDs` to cross-reference with places.';

type ProcessResult = {
    fitOnMap: FitOnMapInput;
};

const isProcessResult = (value: unknown): value is ProcessResult => {
    if (!value || typeof value !== 'object') return false;
    const v = value as { fitOnMap?: unknown };
    return v.fitOnMap !== undefined && isFitOnMapInput(v.fitOnMap);
};

export const executeProcessRoutes = async (
    params: z.infer<typeof processRoutesSchema>,
    state: ToolState,
): Promise<z.infer<typeof processRoutesOutputSchema>> => {
    const { routesEntryIDs, placesEntryIDs, code } = params;

    const sourceEntries = routesEntryIDs?.length
        ? routesEntryIDs.map((id) => state.routing.entries.find((entry) => entry.id === id))
        : [state.routing.entries.at(-1)];

    for (let i = 0; i < sourceEntries.length; i++) {
        if (!sourceEntries[i]) {
            const requestedId = routesEntryIDs?.[i];
            return {
                error: requestedId
                    ? `No entry found with id "${requestedId}". Use recallRoutes to list available IDs.`
                    : 'No routes entries available to process. Run setRoute first.',
            };
        }
    }
    const resolvedEntries = sourceEntries as NonNullable<(typeof sourceEntries)[number]>[];

    const placesByEntryResult = findPlacesByEntry(placesEntryIDs, state);
    if ('error' in placesByEntryResult) return { error: placesByEntryResult.error };
    const placesByEntry = placesByEntryResult.value;

    const inputRoutes: Routes = {
        type: 'FeatureCollection',
        features: resolvedEntries.flatMap((entry) => entry.data.features),
    } as Routes;

    const sandboxResult = await runSandboxedFn(
        code,
        ['routes', 'placesByEntry', 'routeUtils', 'h3', 'turf'],
        [inputRoutes, placesByEntry, routeUtils, h3, turf],
        'Process',
    );
    if ('error' in sandboxResult) return { error: sandboxResult.error };
    const result = sandboxResult.value;

    if (!isProcessResult(result)) {
        return {
            error:
                'Process code must return `{ fitOnMap: [W,S,E,N] | { bbox: [W,S,E,N], padding?, animate? } }`. ' +
                'Derive via `routeUtils.getSectionBBox(route, section)` or `turf.bbox(...)`.',
        };
    }

    return { fitted: applyFitOnMap(state, result.fitOnMap) };
};
