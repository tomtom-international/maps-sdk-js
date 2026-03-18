import type { AreaAnalyticsTileEntry } from '@tomtom-org/maps-sdk/core';
import type { FeatureCollection, Point } from 'geojson';
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
