import type { AreaAnalyticsTileEntry } from '@tomtom-org/maps-sdk/core';
import { booleanPointInPolygon, hexGrid, point as turfPoint } from '@turf/turf';
import type { BBox, FeatureCollection, Point, Polygon } from 'geojson';
import type { AreaAnalyticsDisplayProperties } from '../types/trafficAreaAnalyticsFeature';

/**
 * Converts an array of area-analytics tile entries into a GeoJSON
 * `FeatureCollection<Point>` suitable for the heatmap visualization layer.
 *
 * Each tile centre becomes a Point feature whose properties contain every
 * metric value returned by the API.
 *
 * @param tiles - Tile entries from `TrafficAreaAnalytics.features[0].properties.tiledData.tiles`.
 * @returns A Point FeatureCollection ready to pass to
 *          {@link TrafficAreaAnalyticsModule.show} as the `points` field.
 *
 * @group Traffic Area Analytics
 */
export function tilesToPointFeatures(
    tiles: ReadonlyArray<AreaAnalyticsTileEntry>,
): FeatureCollection<Point, AreaAnalyticsDisplayProperties> {
    return {
        type: 'FeatureCollection',
        features: tiles.map((tile, index) => {
            const [lon, lat] = tile.tileCentre;
            const id = `tile-${index}-${lon}-${lat}`;

            return {
                type: 'Feature',
                id,
                geometry: {
                    type: 'Point',
                    coordinates: [lon, lat],
                },
                properties: {
                    id,
                    speed: tile.speed ?? 0,
                    freeFlowSpeed: tile.freeFlowSpeed ?? 0,
                    congestionLevel: tile.congestionLevel ?? 0,
                    travelTime: tile.travelTime ?? 0,
                    networkLength: tile.networkLength ?? 0,
                },
            };
        }),
    };
}

/**
 * Converts area-analytics tile entries into a GeoJSON
 * `FeatureCollection<Polygon>` of square polygons suitable for the
 * tile-based visualization layer.
 *
 * Each tile centre becomes a small square polygon whose properties
 * contain every metric value returned by the API — no aggregation is applied.
 *
 * @param tiles - Tile entries from the area analytics response.
 * @param halfSideKm - Half the side length of each square in kilometres (default 0.15).
 * @returns A Polygon FeatureCollection ready for the tile source.
 *
 * @group Traffic Area Analytics
 */
/**
 * Compute the half-side length (in degrees) from tile spacing so squares
 * fill the grid without overlapping. Samples a few neighbouring tiles
 * to find the minimum distance, then uses half of that as the half-side.
 */
function computeHalfSideFromSpacing(tiles: ReadonlyArray<AreaAnalyticsTileEntry>): number {
    if (tiles.length < 2) return 0.001; // ~100m fallback

    // Sort tiles by latitude to find nearest neighbours efficiently
    const sorted = [...tiles].sort((a, b) => a.tileCentre[1] - b.tileCentre[1]);

    let minimumDistance = Number.POSITIVE_INFINITY;
    const sampleSize = Math.min(sorted.length, 200);

    for (let i = 0; i < sampleSize - 1; i++) {
        const [longitude1, latitude1] = sorted[i].tileCentre;
        // Check a small window of neighbours
        for (let j = i + 1; j < Math.min(i + 10, sorted.length); j++) {
            const [longitude2, latitude2] = sorted[j].tileCentre;
            const deltaLatitude = Math.abs(latitude2 - latitude1);
            const deltaLongitude = Math.abs(longitude2 - longitude1);
            const distance = Math.max(deltaLatitude, deltaLongitude);

            if (distance > 0.0001 && distance < minimumDistance) {
                minimumDistance = distance;
            }
        }
    }

    // Half-side = half of minimum spacing (tiles touch but don't overlap)
    return minimumDistance < Number.POSITIVE_INFINITY ? minimumDistance * 0.48 : 0.001;
}

export function tilesToSquareFeatures(
    tiles: ReadonlyArray<AreaAnalyticsTileEntry>,
): FeatureCollection<Polygon, AreaAnalyticsDisplayProperties> {
    if (tiles.length === 0) {
        return { type: 'FeatureCollection', features: [] };
    }

    // Compute half-side from the minimum tile spacing to avoid overlaps
    const halfSideDegrees = computeHalfSideFromSpacing(tiles);

    return {
        type: 'FeatureCollection',
        features: tiles.map((tile, index) => {
            const [longitude, latitude] = tile.tileCentre;
            // Adjust longitude offset for latitude (Mercator distortion)
            const latitudeRatio = Math.cos((latitude * Math.PI) / 180);
            const longitudeHalfSide = latitudeRatio > 0.01 ? halfSideDegrees / latitudeRatio : halfSideDegrees;
            const id = `sq-${index}-${longitude}-${latitude}`;

            return {
                type: 'Feature',
                id,
                geometry: {
                    type: 'Polygon',
                    coordinates: [
                        [
                            [longitude - longitudeHalfSide, latitude - halfSideDegrees],
                            [longitude + longitudeHalfSide, latitude - halfSideDegrees],
                            [longitude + longitudeHalfSide, latitude + halfSideDegrees],
                            [longitude - longitudeHalfSide, latitude + halfSideDegrees],
                            [longitude - longitudeHalfSide, latitude - halfSideDegrees],
                        ],
                    ],
                },
                properties: {
                    id,
                    speed: tile.speed ?? 0,
                    freeFlowSpeed: tile.freeFlowSpeed ?? 0,
                    congestionLevel: tile.congestionLevel ?? 0,
                    travelTime: tile.travelTime ?? 0,
                    networkLength: tile.networkLength ?? 0,
                },
            };
        }),
    };
}

/** Default hex cell side length in kilometres. */
const DEFAULT_CELL_SIDE_KM = 0.5;

/**
 * Converts area-analytics tile entries into a hexagonal polygon grid
 * using Turf's `hexGrid` and spatial-join aggregation.
 *
 * Tiles that fall within the same hexagon cell are averaged. Empty hexagons
 * (containing no tiles) are excluded from the result.
 *
 * @param tiles - Tile entries from the area analytics response.
 * @param cellSideKm - Hex cell side length in kilometres (default 0.5).
 * @returns A Polygon FeatureCollection with averaged metric properties.
 *
 * @group Traffic Area Analytics
 */
export function tilesToHexFeatures(
    tiles: ReadonlyArray<AreaAnalyticsTileEntry>,
    cellSideKm = DEFAULT_CELL_SIDE_KM,
): FeatureCollection<Polygon, AreaAnalyticsDisplayProperties> {
    if (tiles.length === 0) {
        return { type: 'FeatureCollection', features: [] };
    }

    // Compute bounding box from tile centres
    let minLon = Number.POSITIVE_INFINITY;
    let minLat = Number.POSITIVE_INFINITY;
    let maxLon = Number.NEGATIVE_INFINITY;
    let maxLat = Number.NEGATIVE_INFINITY;
    for (const tile of tiles) {
        const [lon, lat] = tile.tileCentre;
        if (lon < minLon) minLon = lon;
        if (lat < minLat) minLat = lat;
        if (lon > maxLon) maxLon = lon;
        if (lat > maxLat) maxLat = lat;
    }
    const bbox: BBox = [minLon, minLat, maxLon, maxLat];

    // Generate hex grid covering the tile extent
    const grid = hexGrid(bbox, cellSideKm, { units: 'kilometers' });

    // Spatial-join: for each hex, find tiles inside and aggregate metrics
    const features: FeatureCollection<Polygon, AreaAnalyticsDisplayProperties>['features'] = [];

    for (let i = 0; i < grid.features.length; i++) {
        const hex = grid.features[i];
        let congestionSum = 0;
        let speedSum = 0;
        let freeFlowSum = 0;
        let travelTimeSum = 0;
        let count = 0;

        for (const tile of tiles) {
            const [lon, lat] = tile.tileCentre;
            if (booleanPointInPolygon(turfPoint([lon, lat]), hex)) {
                congestionSum += tile.congestionLevel ?? 0;
                speedSum += tile.speed ?? 0;
                freeFlowSum += tile.freeFlowSpeed ?? 0;
                travelTimeSum += tile.travelTime ?? 0;
                count++;
            }
        }

        if (count === 0) continue;

        const id = `hex-${i}`;
        features.push({
            type: 'Feature',
            id,
            geometry: hex.geometry,
            properties: {
                id,
                congestionLevel: Math.round(congestionSum / count),
                speed: Math.round(speedSum / count),
                freeFlowSpeed: Math.round(freeFlowSum / count),
                travelTime: Math.round((travelTimeSum / count) * 10) / 10,
            },
        });
    }

    return { type: 'FeatureCollection', features };
}
