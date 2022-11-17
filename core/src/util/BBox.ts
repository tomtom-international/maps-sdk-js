import {
    BBox,
    Feature,
    FeatureCollection,
    GeoJsonObject,
    GeometryCollection,
    LineString,
    MultiPolygon,
    Point,
    Polygon,
    Position
} from "geojson";
import { HasBBox, OptionalBBox } from "../types";

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
              bboxToExpand[3] < positionToContain[1] ? positionToContain[1] : bboxToExpand[3]
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
        bboxToExpand[3] < bboxToContain[3] ? bboxToContain[3] : bboxToExpand[3]
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
    let bbox = undefined;
    const indexInterval = Math.ceil(length / 1000);
    for (let i = 0; i < length; i += indexInterval) {
        bbox = bboxExpandedWithPosition(coordinates[i], bbox);
    }
    // (we ensure that if we had intervals greater than 1, the last position is always included in the calculation)
    return indexInterval == 1 ? bbox : bboxExpandedWithPosition(coordinates[length - 1], bbox);
};

/**
 * Extracts or calculates a bounding box from a GeoJSON object which:
 * * Is already a bounding box
 * * Contains a bounding box
 * * Can get a bounding box calculated from its geometry or aggregated parts.
 *
 * "bbox" populated fields take priority over geometries.
 * * Point features might have "bbox" enclosing a broader geometry than just the point, in compliance with TT services.
 *
 * Large geometries approximate their bounding box for speed by preventing to scan each single point.
 * @param hasBBox
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
        if (typeof hasBBox[0] === "number") {
            return hasBBox.length >= 4 ? (hasBBox as OptionalBBox) : undefined;
        } else {
            return bboxFromBBoxes(hasBBox.map((geoJSONItem) => bboxFromGeoJSON(geoJSONItem as GeoJsonObject)));
        }
    }
    // Else...
    // Already containing a BBox:
    const geoJSON = hasBBox as GeoJsonObject;
    if (geoJSON.bbox) {
        return geoJSON.bbox;
    }
    // Else...
    // Needs direct or recursive bbox extraction/calculation:
    switch (geoJSON.type) {
        case "Feature":
            return bboxFromGeoJSON((geoJSON as Feature).geometry);
        case "FeatureCollection":
            return bboxFromBBoxes((geoJSON as FeatureCollection).features.map((feature) => bboxFromGeoJSON(feature)));
        case "GeometryCollection":
            return bboxFromBBoxes(
                (geoJSON as GeometryCollection).geometries.map((geometry) => bboxFromGeoJSON(geometry))
            );
        case "Point":
            return bboxExpandedWithPosition((geoJSON as Point).coordinates);
        case "LineString":
        case "MultiPoint":
            // (LineString and MultiPoint both have the same coordinates type)
            return bboxFromCoordsArray((geoJSON as LineString).coordinates);
        case "MultiLineString":
        case "Polygon":
            // (MultiLineString and Polygon both have the same coordinates type)
            return bboxFromBBoxes((geoJSON as Polygon).coordinates.map((coords) => bboxFromCoordsArray(coords)));
        case "MultiPolygon":
            return bboxFromBBoxes(
                (geoJSON as MultiPolygon).coordinates.flatMap((polygon) =>
                    polygon.map((coords) => bboxFromCoordsArray(coords))
                )
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
 * @param geoJSON
 * @param bboxToExpand
 */
export const bboxExpandedWithGeoJSON = (geoJSON: GeoJsonObject, bboxToExpand?: BBox): OptionalBBox =>
    bboxExpandedWithBBox(bboxFromGeoJSON(geoJSON), bboxToExpand);
