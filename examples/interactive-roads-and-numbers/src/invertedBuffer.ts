import { bboxPolygon, buffer, difference } from '@turf/turf';
import type { Feature, MultiPolygon, Polygon } from 'geojson';

/**
 * Creates an inverted buffer around a feature by subtracting a buffered area from a world bounding box.
 * This creates a polygon that covers everything except the buffered area around the feature.
 */
export const createInvertedBuffer = (
    feature: Feature,
    bufferDistance: number,
    units: 'meters' | 'kilometers' | 'miles' = 'meters',
): Feature => {
    const bufferedFeature = buffer(feature, bufferDistance, { units });
    return difference({
        type: 'FeatureCollection',
        features: [bboxPolygon([-180, 90, 180, -90]), bufferedFeature as Feature<Polygon | MultiPolygon>],
    }) as Feature;
};
