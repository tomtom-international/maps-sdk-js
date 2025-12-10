import { nearestPointOnLine } from '@turf/turf';
import type { Feature, LineString, Position } from 'geojson';
import type { MapGeoJSONFeature } from 'maplibre-gl';

// Finds the closest LineString from a MultiLineString to a given point
const getClosestLineString = (multiLineString: Position[][], point: Position): Position[] => {
    let minDistance = Number.POSITIVE_INFINITY;
    let closestLineString = multiLineString[0];

    for (const lineString of multiLineString) {
        const line: Feature<LineString> = {
            type: 'Feature',
            geometry: { type: 'LineString', coordinates: lineString },
            properties: {},
        };
        const nearest = nearestPointOnLine(line, point);
        const dist = nearest.properties.dist ?? Number.POSITIVE_INFINITY;

        if (dist < minDistance) {
            minDistance = dist;
            closestLineString = lineString;
        }
    }

    return closestLineString;
};

// Extracts a feature with the closest LineString if it's a MultiLineString.
// The given feature is expected to be either a LineString or MultiLineString.
export const findClosestLineString = (feature: MapGeoJSONFeature, mousePosition: Position): Feature<any, any> => {
    const extractedFeature: Feature = {
        type: 'Feature',
        properties: feature.properties,
        geometry: feature.geometry,
    };
    if (extractedFeature.geometry.type === 'MultiLineString') {
        // Create a new feature with the closest LineString geometry
        extractedFeature.geometry = {
            type: 'LineString',
            coordinates: getClosestLineString(extractedFeature.geometry.coordinates, mousePosition),
        };
    }
    return extractedFeature;
};
