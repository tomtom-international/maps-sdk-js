import type { AreaAnalyticsTileEntry, TrafficAreaAnalytics } from '@tomtom-org/maps-sdk/core';
import { bboxFromGeoJSON } from '@tomtom-org/maps-sdk/core';
import { booleanPointInPolygon, hexGrid, squareGrid } from '@turf/turf';
import type { BBox, Feature, FeatureCollection, Point, Polygon } from 'geojson';
import type { AreaAnalyticsDisplayProperties } from '../types/trafficAreaAnalyticsFeature';

/**
 * @ignore
 */
export const tilesToPointFeatures = (
    analytics: TrafficAreaAnalytics,
): FeatureCollection<Point, AreaAnalyticsDisplayProperties> => {
    const tiles = analytics.features.flatMap((feature) => feature.properties?.tiledData?.tiles ?? []);
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
};

type CellAggregate = {
    congestionSum: number;
    speedSum: number;
    freeFlowSum: number;
    travelTimeSum: number;
    networkLengthSum: number;
    count: number;
};

const buildCellAggregates = (
    tiles: ReadonlyArray<AreaAnalyticsTileEntry>,
    grid: FeatureCollection<Polygon>,
): Array<CellAggregate | undefined> => {
    const cellAggregates: Array<CellAggregate | undefined> = [];

    for (const tile of tiles) {
        for (let index = 0; index < grid.features.length; index++) {
            if (booleanPointInPolygon(tile.tileCentre, grid.features[index])) {
                let cell = cellAggregates[index];
                if (cell === undefined) {
                    cell = {
                        congestionSum: 0,
                        speedSum: 0,
                        freeFlowSum: 0,
                        travelTimeSum: 0,
                        networkLengthSum: 0,
                        count: 0,
                    };
                    cellAggregates[index] = cell;
                }
                cell.congestionSum += tile.congestionLevel ?? 0;
                cell.speedSum += tile.speed ?? 0;
                cell.freeFlowSum += tile.freeFlowSpeed ?? 0;
                cell.travelTimeSum += tile.travelTime ?? 0;
                cell.networkLengthSum += tile.networkLength ?? 0;
                cell.count++;
                break;
            }
        }
    }

    return cellAggregates;
};

const cellAggregatesToFeatures = (
    cellAggregates: Array<CellAggregate | undefined>,
    grid: FeatureCollection<Polygon>,
    idPrefix: string,
): Feature<Polygon, AreaAnalyticsDisplayProperties>[] => {
    const features: Feature<Polygon, AreaAnalyticsDisplayProperties>[] = [];

    for (let cellIndex = 0; cellIndex < cellAggregates.length; cellIndex++) {
        const cell = cellAggregates[cellIndex];
        if (!cell) continue;
        const { congestionSum, speedSum, freeFlowSum, travelTimeSum, networkLengthSum, count } = cell;
        const id = `${idPrefix}-${cellIndex}`;
        features.push({
            type: 'Feature',
            id,
            geometry: grid.features[cellIndex].geometry,
            properties: {
                id,
                congestionLevel: Math.round(congestionSum / count),
                speed: Math.round(speedSum / count),
                freeFlowSpeed: Math.round(freeFlowSum / count),
                travelTime: Math.round((travelTimeSum / count) * 10) / 10,
                networkLength: Math.round(networkLengthSum / count),
            },
        });
    }

    return features;
};

const aggregateTilesIntoCells = (
    tiles: ReadonlyArray<AreaAnalyticsTileEntry>,
    grid: FeatureCollection<Polygon>,
    idPrefix: string,
): FeatureCollection<Polygon, AreaAnalyticsDisplayProperties>['features'] =>
    cellAggregatesToFeatures(buildCellAggregates(tiles, grid), grid, idPrefix);

type BuildGridFn = (bbox: BBox, cellSideKm: number) => FeatureCollection<Polygon>;

// Expand the bbox slightly so tile centres that sit exactly on the bbox edge
// fall strictly inside a grid cell. booleanPointInPolygon returns false for
// boundary points, so without this padding those tiles would never be matched.
const BBOX_PADDING_DEG = 0.005; // ~350–550 m — enough for hexGrid/squareGrid to generate cells even when all tiles are very close together

const tilesToGridFeatures = (
    analytics: TrafficAreaAnalytics,
    cellSideKm: number,
    buildGridFn: BuildGridFn,
    idPrefix: string,
): FeatureCollection<Polygon, AreaAnalyticsDisplayProperties> => {
    const allCells: FeatureCollection<Polygon, AreaAnalyticsDisplayProperties>['features'] = [];

    for (let featureIndex = 0; featureIndex < analytics.features.length; featureIndex++) {
        const analyticsFeature = analytics.features[featureIndex];
        const tiles = analyticsFeature.properties?.tiledData?.tiles ?? [];

        if (tiles.length === 0) continue;

        const bbox = bboxFromGeoJSON(analyticsFeature);
        if (!bbox) continue;

        const paddedBbox: BBox = [
            bbox[0] - BBOX_PADDING_DEG,
            bbox[1] - BBOX_PADDING_DEG,
            bbox[2] + BBOX_PADDING_DEG,
            bbox[3] + BBOX_PADDING_DEG,
        ];
        const grid = buildGridFn(paddedBbox, cellSideKm);
        allCells.push(...aggregateTilesIntoCells(tiles, grid, `${idPrefix}-${featureIndex}`));
    }

    return { type: 'FeatureCollection', features: allCells };
};

/**
 * Converts area-analytics tile entries into a hexagonal polygon grid
 * using Turf's `hexGrid` and spatial-join aggregation.
 *
 * Tiles that fall within the same hexagon cell are averaged. Empty hexagons
 * (containing no tiles) are excluded from the result.
 *
 * @param analytics - The parsed `TrafficAreaAnalytics` response.
 * @param cellSideKm - Hex cell side length in kilometres (default 0.25).
 * @returns A Polygon FeatureCollection with averaged metric properties.
 *
 * @ignore
 */
export const tilesToHexFeatures = (
    analytics: TrafficAreaAnalytics,
    cellSideKm = 0.25,
): FeatureCollection<Polygon, AreaAnalyticsDisplayProperties> =>
    tilesToGridFeatures(analytics, cellSideKm, (bbox, km) => hexGrid(bbox, km, { units: 'kilometers' }), 'hex');

/**
 * Converts area-analytics tile entries into a square polygon grid
 * using Turf's `squareGrid` and spatial-join aggregation.
 *
 * Tiles that fall within the same square cell are averaged. Empty cells
 * (containing no tiles) are excluded from the result.
 *
 * @param analytics - The parsed `TrafficAreaAnalytics` response.
 * @param cellSideKm - Square cell side length in kilometres (default 0.5).
 * @returns A Polygon FeatureCollection with averaged metric properties.
 *
 * @ignore
 */
export const tilesToSquareFeatures = (
    analytics: TrafficAreaAnalytics,
    cellSideKm = 0.5,
): FeatureCollection<Polygon, AreaAnalyticsDisplayProperties> =>
    tilesToGridFeatures(analytics, cellSideKm, (bbox, km) => squareGrid(bbox, km, { units: 'kilometers' }), 'square');
