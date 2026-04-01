import type { AreaAnalyticsTileEntry } from '@tomtom-org/maps-sdk/core';
import { booleanPointInPolygon, hexGrid, squareGrid, point as turfPoint } from '@turf/turf';
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
export const tilesToPointFeatures = (
    tiles: ReadonlyArray<AreaAnalyticsTileEntry>,
): FeatureCollection<Point, AreaAnalyticsDisplayProperties> => ({
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
});

const computeTilesBBox = (tiles: ReadonlyArray<AreaAnalyticsTileEntry>): BBox => {
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
    return [minLon, minLat, maxLon, maxLat];
};

const aggregateTilesIntoCells = (
    tiles: ReadonlyArray<AreaAnalyticsTileEntry>,
    grid: FeatureCollection<Polygon>,
    idPrefix: string,
): FeatureCollection<Polygon, AreaAnalyticsDisplayProperties>['features'] => {
    const features: FeatureCollection<Polygon, AreaAnalyticsDisplayProperties>['features'] = [];

    for (let index = 0; index < grid.features.length; index++) {
        const cell = grid.features[index];
        let congestionSum = 0;
        let speedSum = 0;
        let freeFlowSum = 0;
        let travelTimeSum = 0;
        let count = 0;

        for (const tile of tiles) {
            const [lon, lat] = tile.tileCentre;
            if (booleanPointInPolygon(turfPoint([lon, lat]), cell)) {
                congestionSum += tile.congestionLevel ?? 0;
                speedSum += tile.speed ?? 0;
                freeFlowSum += tile.freeFlowSpeed ?? 0;
                travelTimeSum += tile.travelTime ?? 0;
                count++;
            }
        }

        if (count === 0) continue;

        const id = `${idPrefix}-${index}`;
        features.push({
            type: 'Feature',
            id,
            geometry: cell.geometry,
            properties: {
                id,
                congestionLevel: Math.round(congestionSum / count),
                speed: Math.round(speedSum / count),
                freeFlowSpeed: Math.round(freeFlowSum / count),
                travelTime: Math.round((travelTimeSum / count) * 10) / 10,
            },
        });
    }

    return features;
};

/** Default cell side length in kilometres. */
const DEFAULT_CELL_SIDE_KM = 0.5;

type BuildGridFn = (bbox: BBox, cellSideKm: number) => FeatureCollection<Polygon>;

const tilesToGridFeatures = (
    tiles: ReadonlyArray<AreaAnalyticsTileEntry>,
    cellSideKm: number,
    buildGridFn: BuildGridFn,
    idPrefix: string,
): FeatureCollection<Polygon, AreaAnalyticsDisplayProperties> => {
    if (tiles.length === 0) {
        return { type: 'FeatureCollection', features: [] };
    }

    const bbox = computeTilesBBox(tiles);
    const grid = buildGridFn(bbox, cellSideKm);
    return { type: 'FeatureCollection', features: aggregateTilesIntoCells(tiles, grid, idPrefix) };
};

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
 * @ignore
 */
export const tilesToHexFeatures = (
    tiles: ReadonlyArray<AreaAnalyticsTileEntry>,
    cellSideKm = DEFAULT_CELL_SIDE_KM,
): FeatureCollection<Polygon, AreaAnalyticsDisplayProperties> =>
    tilesToGridFeatures(tiles, cellSideKm, (bbox, km) => hexGrid(bbox, km, { units: 'kilometers' }), 'hex');

/**
 * Converts area-analytics tile entries into a square polygon grid
 * using Turf's `squareGrid` and spatial-join aggregation.
 *
 * Tiles that fall within the same square cell are averaged. Empty cells
 * (containing no tiles) are excluded from the result.
 *
 * @param tiles - Tile entries from the area analytics response.
 * @param cellSideKm - Square cell side length in kilometres (default 0.5).
 * @returns A Polygon FeatureCollection with averaged metric properties.
 *
 * @ignore
 */
export const tilesToSquareFeatures = (
    tiles: ReadonlyArray<AreaAnalyticsTileEntry>,
    cellSideKm = DEFAULT_CELL_SIDE_KM,
): FeatureCollection<Polygon, AreaAnalyticsDisplayProperties> =>
    tilesToGridFeatures(tiles, cellSideKm, (bbox, km) => squareGrid(bbox, km, { units: 'kilometers' }), 'square');
