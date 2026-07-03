/**
 * @module agent-toolkit-tools
 */

import type { MultiPolygon, Polygon } from 'geojson';
import type { ToolState } from '../../types';

// Looks up a stored range entry and returns each origin's outermost polygon. Entries store each
// origin's full polygon FeatureCollection — `features[0]` is the largest budget when multi-budget,
// so one polygon per origin covers the entry's full reachable area. Shared by getTrafficIncidents
// (maps each polygon to a bbox) and discoverPlaces (feeds the polygons straight into the search).
// `range` stays caller-side rather than in resolveAreas because it maps to stored isochrones, not a
// geocoded area, and the two consumers want different output shapes.
export const getRangePolygons = (
    state: ToolState,
    rangeId: string,
): { polygons: (Polygon | MultiPolygon)[] } | { error: string } => {
    const rangesEntry = state.ranges.entries.find((e) => e.id === rangeId);
    if (!rangesEntry || rangesEntry.data.length === 0) {
        return { error: `Range "${rangeId}" not found. Use recallState to list available ranges.` };
    }
    const polygons = rangesEntry.data
        .map((r) => r.polygon?.features[0]?.geometry)
        .filter((g): g is Polygon | MultiPolygon => !!g);
    if (polygons.length === 0) {
        return { error: `Range "${rangeId}" has no polygons. Recompute via findReachableAreas.` };
    }
    return { polygons };
};
