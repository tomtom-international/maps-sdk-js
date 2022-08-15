import { Polygon, Position } from "geojson";
import { BoundingBoxAPI } from "../shared/types/APIResponseTypes";

/**
 * @ignore
 * @param csv
 */
export const csvLatLngToPosition = (csv: string): Position => {
    const splitLatLng = csv.split(",");
    return [Number(splitLatLng[1]), Number(splitLatLng[0])];
};

const hasTopLeftPoint = (bbox: { southWest: string; northEast: string } | BoundingBoxAPI): bbox is BoundingBoxAPI => {
    return (<BoundingBoxAPI>bbox).topLeftPoint !== undefined;
};

export const bboxToPolygon = (apiBBox: { southWest: string; northEast: string } | BoundingBoxAPI): Polygon => {
    let westSouth, eastNorth;
    if (hasTopLeftPoint(apiBBox)) {
        westSouth = [apiBBox.topLeftPoint.lon, apiBBox.btmRightPoint.lat];
        eastNorth = [apiBBox.btmRightPoint.lon, apiBBox.topLeftPoint.lat];
    } else {
        westSouth = csvLatLngToPosition(apiBBox.southWest);
        eastNorth = csvLatLngToPosition(apiBBox.northEast);
    }
    const westNorth: Position = [westSouth[0], eastNorth[1]];
    const eastSouth: Position = [eastNorth[0], westSouth[1]];
    return { type: "Polygon", coordinates: [[westSouth, eastSouth, eastNorth, westNorth, westSouth]] };
};

export const polygonToTopLeftBBox = (polygon: Polygon): Position => {
    const { coordinates } = polygon;
    return [coordinates[0][2][1], coordinates[0][0][0]];
};

export const polygonToBtmRightBBox = (polygon: Polygon): Position => {
    const { coordinates } = polygon;
    return [coordinates[0][1][1], coordinates[0][1][0]];
};
