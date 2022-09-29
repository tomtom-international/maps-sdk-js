import { BBox, Feature, LineString, Point, Position } from "geojson";

/**
 * Calculates whether the given bbox has area (width and height).
 * @ignore
 * @param bbox The BBox to verify. If undefined, false is returned.
 */
export const isBBoxWithArea = (bbox: BBox | undefined): boolean =>
    bbox ? bbox.length >= 4 && bbox[3] !== bbox[1] && bbox[2] !== bbox[0] : false;

/**
 * Returns the given bbox if it has area, or undefined otherwise.
 * @ignore
 * @param bbox The BBox to verify. If undefined, undefined is returned.
 */
export const bboxOnlyIfWithArea = (bbox: BBox | undefined): BBox | undefined =>
    isBBoxWithArea(bbox) ? bbox : undefined;

/**
 * Expands the given bounding box with the given position.
 * * If the given bounding box is undefined, the given position is considered alone.
 * This results in a zero-sized bounding box.
 * @ignore
 * @param positionToContain
 * @param bboxToExpand
 */
export const bboxExpandedWithPosition = (positionToContain: Position, bboxToExpand?: BBox): BBox => {
    if (!positionToContain.length) {
        throw Error("bboxExpandedWithPosition: received empty position");
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
export const bboxExpandedWithBBox = (bboxToContain: BBox, bboxToExpand?: BBox): BBox => {
    if (!bboxToExpand) {
        return bboxToContain;
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
export const bboxFromBBoxes = (bboxes: BBox[]): BBox =>
    bboxes.reduce((previous, current) => bboxExpandedWithBBox(current, previous));

/**
 * Expands the given bounding box with the given point Feature.
 * * If the feature has also a bounding box, the latter is considered instead.
 * * If the given bounding box is undefined, the given point is considered alone.
 * This results in a zero-sized bounding box or the point bbox if it exists.
 * @ignore
 * @param feature
 * @param bboxToExpand
 */
export const bboxExpandedWithPointFeature = (feature: Feature<Point>, bboxToExpand?: BBox): BBox => {
    const bbox = feature.bbox || feature.geometry?.bbox;
    if (bbox) {
        return bboxExpandedWithBBox(bbox, bboxToExpand);
    } else {
        return bboxExpandedWithPosition(feature.geometry.coordinates, bboxToExpand);
    }
};

/**
 * Calculates a bounding box from the given point features.
 * * If any feature also has a bbox, the latter is considered instead.
 * @ignore
 * @param features
 * @return
 */
export const bboxFromPointFeatures = (features: Feature<Point>[]): BBox | undefined => {
    let bbox: BBox | undefined = undefined;
    for (const feature of features) {
        bbox = bboxExpandedWithPointFeature(feature, bbox);
    }
    return bbox;
};

/**
 * Calculates a bounding box from an array of coordinates.
 * * If the array is beyond a certain size, it doesn't scan it fully,
 * for performance, but still ensures a decent accuracy.
 *
 * @ignore
 * @param coordinates Should always be passed, but undefined is also supported, resulting in undefined bbox.
 */
export const quickBBoxFromCoordsArray = (coordinates: Position[] | undefined): BBox | undefined => {
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
 * Calculates a bounding box from a LineString.
 * * If the array is beyond a certain size, it doesn't scan it fully,
 * for performance, but ensures a decent accuracy still.
 *
 * @ignore
 * @param lineString Should always be passed, but undefined is also supported, resulting in undefined bbox.
 */
export const quickBBoxFromLineString = (lineString: LineString | undefined): BBox | undefined =>
    quickBBoxFromCoordsArray(lineString?.coordinates);
