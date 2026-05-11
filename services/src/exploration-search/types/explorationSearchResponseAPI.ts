import type { AddressProperties, TimeZone } from '@tomtom-org/maps-sdk/core';
import type { Position } from 'geojson';
import type { ExplorationRecordType } from './explorationSearchParams';

/**
 * @ignore
 */
export type ExplorationClassificationAPI = {
    code: string;
    name: string;
};

/**
 * @ignore
 */
export type ExplorationBrandAPI = {
    id?: string;
    name: string;
};

/**
 * @ignore
 * Raw TomTom opening-hours payload. The API exposes the compact string form
 * (`raw`) plus the 24h flag; no parsed time ranges yet.
 */
export type ExplorationOpeningHoursAPI = {
    raw: string;
    is24h?: boolean;
};

/**
 * @ignore
 */
export type ExplorationChargingParkAPI = {
    stationId?: string;
    connectors?: { id: string }[];
};

/**
 * @ignore
 * POI document fields nested under `poi` on each hit. The API strips
 * per-language name maps (`names`, `alternativeNames`) and the street
 * alternative-name map on the way out, so they are not modeled here.
 */
export type ExplorationPOIAPI = {
    name?: string;
    phone?: string;
    url?: string;
    brands?: ExplorationBrandAPI[];
    categorySet?: string[];
    classifications?: ExplorationClassificationAPI[];
    preferredCategoryId?: string;
    nearbyCategoryIds?: string[] | null;
    feature?: string;
    openingHours?: ExplorationOpeningHoursAPI;
    accessType?: string | null;
    outOfBusiness?: string | null;
    heavyVehicleCategories?: string[];
    timeZone?: TimeZone;
};

/**
 * @ignore
 * Envelope bounding box on Street records — two corner `[lon, lat]` positions.
 */
export type ExplorationViewportAPI = {
    type: 'envelope';
    coordinates: [Position, Position];
};

/**
 * @ignore
 * Hit shape shared across record types. API metadata (`id`, `score`,
 * `distance_m`, `address`, `position`) sits at the top level; POI document
 * fields are nested under `poi` on `type === 'POI'` hits. Positions are
 * GeoJSON `[lon, lat]` arrays (the API normalizes OpenSearch's `{lat, lon}`
 * storage form on the way out).
 *
 * Field presence by record type:
 * - `poi` — POI records only
 * - `viewport` — Street records only (envelope of the street extent)
 * - `address.entryPoint` — PointAddress records only
 */
export type ExplorationSearchResultAPI = {
    id: string;
    score?: number;
    distance_m?: number;
    type?: ExplorationRecordType;
    dataSource?: string;
    sourceId?: string;
    country_code?: string;
    aliasIds?: string[];
    address?: AddressProperties & { entryPoint?: string };
    position: Position;
    viewport?: ExplorationViewportAPI;
    vehicleTypes?: string[];
    chargingPark?: ExplorationChargingParkAPI;
    placeId?: string;
    adminChainId?: string;
    poi?: ExplorationPOIAPI;
};

/**
 * @ignore
 * Envelope response shape — `total` is capped at 10000 even when more records match.
 */
export type ExplorationSearchResponseAPI = {
    total: number;
    hits: ExplorationSearchResultAPI[];
};
