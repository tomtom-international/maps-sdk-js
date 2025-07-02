import type { BBox, Position } from 'geojson';
import type { BoundingBoxAPI, BoundingBoxTopLeftAPI, LatLonAPI } from './types/apiPlacesResponseTypes';

/**
 * @ignore
 * @param csv
 */
export const csvLatLngToPosition = (csv: string): Position => {
    const splitLatLng = csv.split(',');
    return [Number(splitLatLng[1]), Number(splitLatLng[0])];
};

/**
 * @ignore
 * @param position
 */
export const positionToCSVLatLon = (position: Position): string => `${position[1]},${position[0]}`;

const hasTopLeftPoint = (bbox: BoundingBoxAPI): bbox is BoundingBoxTopLeftAPI => {
    return (<BoundingBoxTopLeftAPI>bbox).topLeftPoint !== undefined;
};

/**
 * @ignore
 * @param apiBBox
 */
export const apiToGeoJSONBBox = (apiBBox: BoundingBoxAPI): BBox => {
    let westSouth: Position;
    let eastNorth: Position;
    if (hasTopLeftPoint(apiBBox)) {
        westSouth = [apiBBox.topLeftPoint.lon, apiBBox.btmRightPoint.lat];
        eastNorth = [apiBBox.btmRightPoint.lon, apiBBox.topLeftPoint.lat];
    } else {
        westSouth = csvLatLngToPosition(apiBBox.southWest);
        eastNorth = csvLatLngToPosition(apiBBox.northEast);
    }
    return [westSouth[0], westSouth[1], eastNorth[0], eastNorth[1]];
};

/**
 * @ignore
 * @param point
 */
export const latLonAPIToPosition = (point: LatLonAPI): Position => {
    return [point.lon, point.lat];
};
