import { type BBox, bboxFromGeoJSON, getPosition, poiCategoriesToID } from '@tomtom-org/maps-sdk/core';
import type { MultiPolygon, Polygon, Position } from 'geojson';
import type { Circle, SearchGeometryInput } from '../geometry-search/types';
import type { ExplorationSearchParams, ExplorationSearchPayloadAPI, ExplorationSearchRequestAPI } from './types';

const DEFAULT_NEAR_RADIUS_KM = 2;
const CIRCLE_POLYGON_SAMPLES = 64;
const EARTH_RADIUS_M = 6371000;

// Experimental places-api deployment — keeping this URL hardcoded until the service graduates.
// const EXPLORATION_SEARCH_BASE_URL = 'https://search-places-poc.braveriver-6e85d43a.westeurope.azurecontainerapps.io';
const EXPLORATION_SEARCH_BASE_URL = 'https://search-places-poc.whitebush-bbe9c5f7.westeurope.azurecontainerapps.io';

const buildUrlBasePath = (params: ExplorationSearchParams): string =>
    params.customServiceBaseURL ?? EXPLORATION_SEARCH_BASE_URL;

const toNearPayload = (params: ExplorationSearchParams): ExplorationSearchPayloadAPI['near'] => {
    const coordinates = getPosition(params.position);
    if (!coordinates) return undefined;
    const radiusKm =
        params.radiusMeters && params.radiusMeters > 0 ? params.radiusMeters / 1000 : DEFAULT_NEAR_RADIUS_KM;
    return { coordinates, radius_km: radiusKm };
};

const toCategoriesPayload = (params: ExplorationSearchParams): string[] | undefined =>
    params.poiCategories?.length
        ? params.poiCategories.map((category) => String(poiCategoriesToID[category]))
        : undefined;

const toBboxesPayload = (params: ExplorationSearchParams): BBox[] | undefined => {
    const inputs = [...(params.boundingBox ? [params.boundingBox] : []), ...(params.boundingBoxes ?? [])];
    const bboxes = inputs.map((input) => bboxFromGeoJSON(input)).filter((bbox): bbox is BBox => bbox !== undefined);
    return bboxes.length ? bboxes : undefined;
};

// Samples a circle boundary into an equirectangular-approximation Polygon ring
// so Circle inputs can be sent to a places API that only accepts GeoJSON polygons.
const circleToPolygon = (circle: Circle): Polygon => {
    const [lon, lat] = circle.coordinates;
    const dLatDeg = (circle.radius / EARTH_RADIUS_M) * (180 / Math.PI);
    const dLonDeg = dLatDeg / Math.cos((lat * Math.PI) / 180);
    const ring: Position[] = [];
    for (let i = 0; i < CIRCLE_POLYGON_SAMPLES; i++) {
        const angle = (2 * Math.PI * i) / CIRCLE_POLYGON_SAMPLES;
        ring.push([lon + dLonDeg * Math.cos(angle), lat + dLatDeg * Math.sin(angle)]);
    }
    ring.push(ring[0]);
    return { type: 'Polygon', coordinates: [ring] };
};

const normalizeGeometry = (input: SearchGeometryInput): (Polygon | MultiPolygon)[] => {
    switch (input.type) {
        case 'Polygon':
        case 'MultiPolygon':
            return [input];
        case 'Circle':
            return [circleToPolygon(input)];
        case 'FeatureCollection':
            return input.features.map((feature) => feature.geometry);
    }
};

// The places-api validates Polygon/MultiPolygon rings strictly via OpenSearch and rejects:
//   - unclosed rings → "invalid LinearRing found (coordinates are not closed)"
//   - consecutive duplicate points → "invalid_shape_exception: Provided shape has duplicate consecutive coordinates"
// Upstream sources (reachable-area outputs, isoline libraries, hand-authored polygons) regularly
// produce either, so we normalise here — the wire request is the one place every caller converges.
const dedupeConsecutive = (ring: Position[]): Position[] =>
    ring.filter((point, index) => index === 0 || point[0] !== ring[index - 1][0] || point[1] !== ring[index - 1][1]);

const closeRing = (ring: Position[]): Position[] => {
    if (ring.length < 2) return ring;
    const [first, last] = [ring[0], ring[ring.length - 1]];
    return first[0] === last[0] && first[1] === last[1] ? ring : [...ring, [...first]];
};

const sanitizeRing = (ring: Position[]): Position[] => closeRing(dedupeConsecutive(ring));

const sanitizeGeometry = <G extends Polygon | MultiPolygon>(geometry: G): G => {
    if (geometry.type === 'Polygon') {
        return { ...geometry, coordinates: geometry.coordinates.map(sanitizeRing) } as G;
    }
    return {
        ...geometry,
        coordinates: geometry.coordinates.map((polygon) => polygon.map(sanitizeRing)),
    } as G;
};

const toGeometriesPayload = (params: ExplorationSearchParams): (Polygon | MultiPolygon)[] | undefined => {
    if (!params.geometries?.length) return undefined;
    const geometries = params.geometries.flatMap(normalizeGeometry).map(sanitizeGeometry);
    return geometries.length ? geometries : undefined;
};

const toMunicipalitiesPayload = (params: ExplorationSearchParams): string[] | undefined =>
    params.municipalities?.length ? params.municipalities : undefined;

/**
 * Default function for building an exploration search request from {@link ExplorationSearchParams}.
 * @param params The exploration search parameters, with global configuration already merged into them.
 */
export const buildExplorationSearchRequest = (params: ExplorationSearchParams): ExplorationSearchRequestAPI => {
    const url = new URL('/places', buildUrlBasePath(params));
    const near = toNearPayload(params);
    const categories = toCategoriesPayload(params);
    const bboxes = toBboxesPayload(params);
    const geometries = toGeometriesPayload(params);
    const municipalities = toMunicipalitiesPayload(params);
    const data: ExplorationSearchPayloadAPI = {
        ...(params.query && { q: params.query }),
        ...(params.countries?.[0] && { country: params.countries[0] }),
        ...(municipalities && { municipalities }),
        ...(params.poiBrands?.[0] && { brand: params.poiBrands[0] }),
        ...(categories && { categories }),
        ...(params.placeTypes?.length && { types: params.placeTypes }),
        ...(near && { near }),
        ...(bboxes && { bboxes }),
        ...(geometries && { geometries }),
        ...(params.offset !== undefined && { from: params.offset }),
        ...(params.limit !== undefined && { size: params.limit }),
    };
    return { url, data };
};
