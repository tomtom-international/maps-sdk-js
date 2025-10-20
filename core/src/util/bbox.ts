import type {
    BBox,
    Feature,
    FeatureCollection,
    GeoJsonObject,
    GeometryCollection,
    LineString,
    MultiPolygon,
    Point,
    Polygon,
    Position,
} from 'geojson';
import type { HasBBox, OptionalBBox } from '../types';

/**
 * Calculates whether the given bbox has area (width and height).
 * @ignore
 * @param bbox The BBox to verify. If undefined, false is returned.
 */
export const isBBoxWithArea = (bbox: OptionalBBox): boolean =>
    bbox ? bbox.length >= 4 && bbox[3] !== bbox[1] && bbox[2] !== bbox[0] : false;

/**
 * Returns the given bbox if it has area, or undefined otherwise.
 * @ignore
 * @param bbox The BBox to verify. If undefined, undefined is returned.
 */
export const bboxOnlyIfWithArea = (bbox: OptionalBBox): OptionalBBox => (isBBoxWithArea(bbox) ? bbox : undefined);

/**
 * Expands the given bounding box with the given position.
 * * If the given bounding box is undefined, the given position is considered alone.
 * This results in a zero-sized bounding box.
 * @ignore
 * @param positionToContain
 * @param bboxToExpand
 */
export const bboxExpandedWithPosition = (positionToContain: Position, bboxToExpand?: BBox): OptionalBBox => {
    if (!positionToContain || positionToContain.length < 2) {
        return undefined;
    }
    return bboxToExpand
        ? [
              // min longitude:
              bboxToExpand[0] > positionToContain[0] ? positionToContain[0] : bboxToExpand[0],
              // min latitude:
              bboxToExpand[1] > positionToContain[1] ? positionToContain[1] : bboxToExpand[1],
              // max longitude:
              bboxToExpand[2] < positionToContain[0] ? positionToContain[0] : bboxToExpand[2],
              // max latitude:
              bboxToExpand[3] < positionToContain[1] ? positionToContain[1] : bboxToExpand[3],
          ]
        : // single point bbox with no size:
          [positionToContain[0], positionToContain[1], positionToContain[0], positionToContain[1]];
};

/**
 * @ignore
 * @param bboxToContain
 * @param bboxToExpand
 */
export const bboxExpandedWithBBox = (bboxToContain: OptionalBBox, bboxToExpand?: BBox): OptionalBBox => {
    if (!bboxToExpand || !bboxToContain) {
        return bboxToContain || bboxToExpand;
    }
    return [
        // min longitude:
        bboxToExpand[0] > bboxToContain[0] ? bboxToContain[0] : bboxToExpand[0],
        // min latitude:
        bboxToExpand[1] > bboxToContain[1] ? bboxToContain[1] : bboxToExpand[1],
        // max longitude:
        bboxToExpand[2] < bboxToContain[2] ? bboxToContain[2] : bboxToExpand[2],
        // max latitude:
        bboxToExpand[3] < bboxToContain[3] ? bboxToContain[3] : bboxToExpand[3],
    ];
};

/**
 * Calculates the bounding box which contains all the given bounding boxes.
 * @ignore
 * @param bboxes
 */
export const bboxFromBBoxes = (bboxes: OptionalBBox[]): OptionalBBox =>
    bboxes?.length ? bboxes.reduce((previous, current) => bboxExpandedWithBBox(current, previous)) : undefined;

/**
 * Calculates a bounding box from an array of coordinates.
 * * If the array is beyond a certain size, it doesn't scan it fully,
 * for performance, but still ensures a decent accuracy.
 *
 * @ignore
 * @param coordinates Should always be passed, but undefined is also supported, resulting in undefined bbox.
 */
export const bboxFromCoordsArray = (coordinates: Position[] | undefined): OptionalBBox => {
    const length = coordinates?.length;
    if (!length) {
        return undefined;
    }
    let bbox: OptionalBBox;
    const indexInterval = Math.ceil(length / 1000);
    for (let i = 0; i < length; i += indexInterval) {
        bbox = bboxExpandedWithPosition(coordinates[i], bbox);
    }
    // (we ensure that if we had intervals greater than 1, the last position is always included in the calculation)
    return indexInterval === 1 ? bbox : bboxExpandedWithPosition(coordinates[length - 1], bbox);
};

/**
 * Extracts or calculates a bounding box from GeoJSON objects.
 *
 * This utility function handles various GeoJSON types and automatically determines
 * the best approach to obtain a bounding box:
 * - Uses existing `bbox` properties when available (fastest)
 * - Calculates from geometry coordinates when needed
 * - Aggregates bounding boxes from collections
 * - Optimizes large geometries by sampling points for performance
 *
 * The function prioritizes existing bbox fields over geometry calculations, which is
 * important for Point features from TomTom services that may have bbox representing
 * a broader area than just the point location.
 *
 * @param hasBBox A GeoJSON object (Feature, FeatureCollection, Geometry, etc.) or array of such objects
 * @returns The bounding box as `[minLng, minLat, maxLng, maxLat]`, or `undefined` if input is invalid
 *
 * @example
 * ```typescript
 * // From a Feature with existing bbox
 * const place = await geocode({ key: 'key', query: 'Amsterdam' });
 * const bbox = bboxFromGeoJSON(place);
 * // Returns the bbox that came with the place
 *
 * // From a Polygon geometry (calculates bbox)
 * const polygon = {
 *   type: 'Polygon',
 *   coordinates: [[
 *     [4.88, 52.36],
 *     [4.90, 52.36],
 *     [4.90, 52.38],
 *     [4.88, 52.38],
 *     [4.88, 52.36]
 *   ]]
 * };
 * const polyBbox = bboxFromGeoJSON(polygon);
 * // Returns: [4.88, 52.36, 4.90, 52.38]
 *
 * // From a FeatureCollection (aggregates all features)
 * const places = await search({ key: 'key', query: 'coffee' });
 * const collectionBbox = bboxFromGeoJSON(places);
 * // Returns bbox encompassing all search results
 *
 * // From a LineString (calculates from coordinates)
 * const route = await calculateRoute({
 *   key: 'key',
 *   geoInputs: [[4.9, 52.3], [4.5, 51.9]]
 * });
 * const routeBbox = bboxFromGeoJSON(route.routes[0].geometry);
 * // Returns bbox containing the entire route
 *
 * // From an array of GeoJSON objects
 * const multiBbox = bboxFromGeoJSON([place1, place2, place3]);
 * // Returns bbox encompassing all three places
 * ```
 *
 * @group Shared
 * @category Functions
 */
export const bboxFromGeoJSON = (hasBBox: HasBBox): OptionalBBox => {
    // Edge case:
    if (!hasBBox) {
        return undefined;
    }
    // Else...
    // Already a BBox:
    if (Array.isArray(hasBBox)) {
        if (typeof hasBBox[0] === 'number') {
            return hasBBox.length >= 4 ? (hasBBox as OptionalBBox) : undefined;
        }
        return bboxFromBBoxes(hasBBox.map((geoJsonItem) => bboxFromGeoJSON(geoJsonItem as GeoJsonObject)));
    }
    // Else...
    // Already containing a BBox:
    if (hasBBox.bbox) {
        return hasBBox.bbox;
    }
    // Else...
    // Needs direct or recursive bbox extraction/calculation:
    switch (hasBBox.type) {
        case 'Feature':
            return bboxFromGeoJSON((hasBBox as Feature).geometry);
        case 'FeatureCollection':
            return bboxFromBBoxes((hasBBox as FeatureCollection).features.map(bboxFromGeoJSON));
        case 'GeometryCollection':
            return bboxFromBBoxes((hasBBox as GeometryCollection).geometries.map(bboxFromGeoJSON));
        case 'Point':
            return bboxExpandedWithPosition((hasBBox as Point).coordinates);
        case 'LineString':
        case 'MultiPoint':
            // (LineString and MultiPoint both have the same coordinates type)
            return bboxFromCoordsArray((hasBBox as LineString).coordinates);
        case 'MultiLineString':
        case 'Polygon':
            // (MultiLineString and Polygon both have the same coordinates type)
            return bboxFromBBoxes((hasBBox as Polygon).coordinates.map(bboxFromCoordsArray));
        case 'MultiPolygon':
            return bboxFromBBoxes(
                (hasBBox as MultiPolygon).coordinates.flatMap((polygon) => polygon.map(bboxFromCoordsArray)),
            );
        default:
            return undefined;
    }
};

/**
 * Expands the given bounding box with the given GeoJSON.
 * * If the feature has also a bounding box, the latter is considered instead.
 * * If the given bounding box is undefined, the given point is considered alone.
 * This results in a zero-sized bounding box or the point bbox if it exists.
 * @ignore
 * @param geoJson
 * @param bboxToExpand
 */
export const bboxExpandedWithGeoJSON = (geoJson: GeoJsonObject, bboxToExpand?: BBox): OptionalBBox =>
    bboxExpandedWithBBox(bboxFromGeoJSON(geoJson), bboxToExpand);

/**
 * Calculate the center of bbox
 * @ignore
 * @param bbox
 * */
export const bboxCenter = (bbox: BBox): Position => [(bbox[0] + bbox[2]) / 2, (bbox[1] + bbox[3]) / 2];
