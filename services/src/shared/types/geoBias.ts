import type { HasBBox, HasLngLat } from '@tomtom-org/maps-sdk/core';

/**
 * A point to search around, optionally bounded by a radius.
 *
 * @remarks
 * Without `radiusMeters` the point biases the ranking without restricting results; with it, results
 * are confined to that circle.
 *
 * @group Search
 */
export type PointGeoBias = {
    /**
     * The point to search around, as `[longitude, latitude]` or any GeoJSON form carrying one.
     */
    position: HasLngLat;

    /**
     * Radius around `position`, in metres. Values of zero or less are ignored by the API.
     */
    radiusMeters?: number;
};

/**
 * A rectangle to confine results to.
 *
 * @group Search
 */
export type BoundingBoxGeoBias = {
    /**
     * The rectangle, as `[minLongitude, minLatitude, maxLongitude, maxLatitude]` or any GeoJSON
     * value a bounding box can be derived from — a `bbox` property, a Feature, or a geometry.
     */
    boundingBox: HasBBox;
};

/**
 * Where to look: a point with an optional radius, or a bounding box — one or the other.
 *
 * @remarks
 * The two cannot be combined, which is why they are a union rather than separate options: an
 * endpoint applies exactly one geographic bias per request.
 *
 * @example
 * ```typescript
 * // Around a point, ranking bias only
 * const nearAmsterdam: GeoBias = { position: [4.9, 52.3] };
 *
 * // Around a point, confined to 2 km
 * const within2km: GeoBias = { position: [4.9, 52.3], radiusMeters: 2000 };
 *
 * // Inside the visible map area
 * const inViewport: GeoBias = { boundingBox: map.getBounds().toArray().flat() as BBox };
 * ```
 *
 * @group Search
 */
export type GeoBias =
    | (PointGeoBias & { boundingBox?: never })
    | (BoundingBoxGeoBias & { position?: never; radiusMeters?: never });
