import type { Feature, Point, Position } from 'geojson';
import type { EntryPoint, GetPositionOptions, HasLngLat, Place } from '../types';

const getMainEntryPoint = (place: Place): EntryPoint | undefined =>
    place?.properties?.entryPoints?.find((entryPoint) => entryPoint.type === 'main');

/**
 * Extracts the lng-lat position from various input formats.
 *
 * This utility function accepts multiple formats and normalizes them to a standard
 * GeoJSON Position (lng-lat coordinate array). It handles:
 * - Raw coordinate arrays `[lng, lat]`
 * - GeoJSON Point geometries
 * - GeoJSON Point Features (including Places with entry points)
 *
 * @param hasLngLat An object which either is or contains a lng-lat position.
 * @param options Additional options to control how we extract the position.
 * @returns The extracted position as `[longitude, latitude]`, or `null` if the input is invalid.
 *
 * @example
 * ```typescript
 * // From coordinate array
 * getPosition([4.9, 52.3]); // Returns: [4.9, 52.3]
 *
 * // From Point geometry
 * getPosition({
 *   type: 'Point',
 *   coordinates: [4.9, 52.3]
 * }); // Returns: [4.9, 52.3]
 *
 * // From Point Feature
 * getPosition({
 *   type: 'Feature',
 *   geometry: { type: 'Point', coordinates: [4.9, 52.3] },
 *   properties: {}
 * }); // Returns: [4.9, 52.3]
 *
 * // From Place with entry point
 * const place = {
 *   type: 'Feature',
 *   geometry: { type: 'Point', coordinates: [4.9, 52.3] },
 *   properties: {
 *     entryPoints: [
 *       { type: 'main', position: [4.901, 52.301] }
 *     ]
 *   }
 * };
 * getPosition(place, { useEntryPoint: 'main-when-available' });
 * // Returns: [4.901, 52.301] (entry point instead of geometry)
 *
 * // Invalid input
 * getPosition(undefined); // Returns: null
 * ```
 *
 * @group Shared
 */
export const getPosition = (hasLngLat: HasLngLat | undefined, options?: GetPositionOptions): Position | null => {
    if (hasLngLat) {
        if (Array.isArray(hasLngLat)) {
            // GeoJSON Position (lng-lat):
            return hasLngLat;
        }
        if ((hasLngLat as Point).coordinates) {
            // GeoJSON Point Geometry:
            return (hasLngLat as Point).coordinates;
        }
        if ((hasLngLat as Feature).geometry) {
            // GeoJSON Point Feature:
            if (options?.useEntryPoint === 'main-when-available') {
                const mainEntryPoint = getMainEntryPoint(hasLngLat as Place);
                return mainEntryPoint?.position ?? (hasLngLat as Feature<Point>).geometry.coordinates;
            }
            return (hasLngLat as Feature<Point>).geometry.coordinates;
        }
    }
    return null;
};

/**
 * Extracts the lng-lat position from various input formats (strict version).
 *
 * Similar to {@link getPosition}, but throws an error if the input doesn't contain
 * a valid position. Use this when you expect the input to always be valid and want
 * to fail fast on invalid data.
 *
 * @param hasLngLat An object which either is or contains a lng-lat position.
 * @param options Additional options to control how we extract the position.
 * @returns The extracted position as `[longitude, latitude]`.
 * @throws Error if the input object is undefined or does not contain a lng-lat position.
 *
 * @example
 * ```typescript
 * // Valid input
 * getPositionStrict([4.9, 52.3]); // Returns: [4.9, 52.3]
 *
 * // Invalid input throws error
 * try {
 *   getPositionStrict(undefined);
 * } catch (error) {
 *   console.error(error);
 *   // Error: The received object does not have lng-lat coordinates: undefined
 * }
 *
 * // Invalid object throws error
 * try {
 *   getPositionStrict({ invalid: 'object' });
 * } catch (error) {
 *   console.error(error);
 *   // Error: The received object does not have lng-lat coordinates: {"invalid":"object"}
 * }
 * ```
 *
 * @group Shared
 */
export const getPositionStrict = (hasLngLat: HasLngLat, options?: GetPositionOptions): Position => {
    const position = getPosition(hasLngLat, options);
    if (!position) {
        throw new Error(`The received object does not have lng-lat coordinates: ${JSON.stringify(hasLngLat)}`);
    }
    return position;
};

/**
 * @ignore
 * @param lngLat
 */
export const toPointFeature = (lngLat: Position): Feature<Point> => ({
    type: 'Feature',
    geometry: { type: 'Point', coordinates: lngLat } as Point,
    properties: {},
});
