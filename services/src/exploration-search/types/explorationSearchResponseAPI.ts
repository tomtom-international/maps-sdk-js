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
 * A single open interval inside {@link ExplorationOpeningHoursAPI.intervals}.
 *
 * - `days` — ISO day-of-week numbers `1` (Monday) through `7` (Sunday) the
 *   interval applies to.
 * - `open` / `close` — `HH:MM` strings. `"24:00"` denotes end-of-day so that
 *   round-the-clock intervals can be expressed as `00:00` → `24:00`.
 */
export type ExplorationOpeningIntervalAPI = {
    days: number[];
    open: string;
    close: string;
};

/**
 * @ignore
 * Opening-hours payload as returned by the places-api. The compact raw
 * TomTom hours string is parsed upstream into structured `intervals`; the
 * source string is not exposed in the API response.
 */
export type ExplorationOpeningHoursAPI = {
    is24h?: boolean;
    intervals?: ExplorationOpeningIntervalAPI[];
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
    /** Id of the municipality polygon the hit sits in. Populated for DE / NL / FR only. */
    area_id?: string;
    /** ISO2 country of the municipality polygon the hit sits in. Populated for DE / NL / FR only. */
    area_country?: string;
    /** Area-character tokens propagated from the hit's municipality polygon. Populated for DE / NL / FR only. */
    area_tags?: string[];
};

/**
 * @ignore
 * Envelope response shape — `total` is capped at 10000 even when more records match.
 */
export type ExplorationSearchResponseAPI = {
    total: number;
    hits: ExplorationSearchResultAPI[];
};
