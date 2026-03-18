import type { AreaAnalyticsTileEntry } from '@tomtom-org/maps-sdk/core';
import { cellToBoundary, latLngToCell } from 'h3-js';
import type { AreaAnalyticsDisplayProperties } from '@tomtom-org/maps-sdk/map';

const DEFAULT_H3_RESOLUTION = 8;

/**
 * Aggregates area-analytics tile entries into H3 hexagonal polygons.
 *
 * Multiple tiles that fall within the same H3 cell are averaged.
 * Returns a FeatureCollection of Polygon features with all metric
 * values as properties — ready for {@link TrafficAreaAnalyticsModule.show}.
 */
export function tilesToHexFeatures(
    tiles: ReadonlyArray<AreaAnalyticsTileEntry>,
    resolution = DEFAULT_H3_RESOLUTION,
): GeoJSON.FeatureCollection<GeoJSON.Polygon, AreaAnalyticsDisplayProperties> {
    // Group tiles by H3 cell index
    const cellMap = new Map<
        string,
        { congestionLevel: number; speed: number; freeFlowSpeed: number; travelTime: number; count: number }
    >();

    for (const tile of tiles) {
        const [lon, lat] = tile.tileCentre;
        const cellId = latLngToCell(lat, lon, resolution); // h3-js expects (lat, lon)

        const existing = cellMap.get(cellId);
        if (existing) {
            existing.congestionLevel += tile.congestionLevel ?? 0;
            existing.speed += tile.speed ?? 0;
            existing.freeFlowSpeed += tile.freeFlowSpeed ?? 0;
            existing.travelTime += tile.travelTime ?? 0;
            existing.count++;
        } else {
            cellMap.set(cellId, {
                congestionLevel: tile.congestionLevel ?? 0,
                speed: tile.speed ?? 0,
                freeFlowSpeed: tile.freeFlowSpeed ?? 0,
                travelTime: tile.travelTime ?? 0,
                count: 1,
            });
        }
    }

    // Convert cells to GeoJSON polygon features
    const features = [...cellMap.entries()].map(([cellId, agg]) => {
        const n = agg.count;
        const boundary = cellToBoundary(cellId);
        // cellToBoundary returns [lat, lng][] — convert to GeoJSON [lng, lat][]
        const coords: [number, number][] = boundary.map(([lat, lng]) => [lng, lat]);
        coords.push(coords[0]); // close the ring

        return {
            type: 'Feature' as const,
            id: cellId,
            geometry: {
                type: 'Polygon' as const,
                coordinates: [coords],
            },
            properties: {
                id: cellId,
                congestionLevel: Math.round(agg.congestionLevel / n),
                speed: Math.round(agg.speed / n),
                freeFlowSpeed: Math.round(agg.freeFlowSpeed / n),
                travelTime: Math.round((agg.travelTime / n) * 10) / 10,
            },
        };
    });

    return { type: 'FeatureCollection', features };
}
