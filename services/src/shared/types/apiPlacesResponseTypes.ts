import type {
    AddressProperties,
    Brand,
    Classification,
    Connector,
    ConnectorType,
    EntryPoint,
    OpeningHours,
    SearchPlaceProps,
    TimeZone,
} from '@tomtom-org/maps-sdk-js/core';
import type { SearchSummary } from './searchSummary';

/**
 * @ignore
 */
export type LatLonAPI = {
    /**
     * Latitude. min/max: -90 to +90
     */
    lat: number;
    /**
     * Longitude. min/max: -180 to +180
     */
    lon: number;
};

/**
 * @ignore
 */
export type ViewportAPI = {
    /**
     * Top-left corner of the rectangle
     */
    topLeftPoint: LatLonAPI;
    /**
     * Bottom-right corner of the rectangle
     */
    btmRightPoint: LatLonAPI;
};

/**
 * @ignore
 */
export type BoundingBoxTopLeftAPI = ViewportAPI;

/**
 * @ignore
 */
export type BoundingBoxSouthWestAPI = { southWest: string; northEast: string };

/**
 * @ignore
 */
export type BoundingBoxAPI = BoundingBoxTopLeftAPI | BoundingBoxSouthWestAPI;

/**
 * @ignore
 */
export type EntryPointAPI = Omit<EntryPoint, 'position'> & {
    /**
     * Position of the entry point.
     */
    position: LatLonAPI;
};

/**
 * @ignore
 */
export type AddressRangesAPI = {
    /**
     * An address range on the left side of a street segment (assuming looking from the "from" end toward the "to" end).
     */
    rangeLeft: string;
    /**
     * An address range on the right side of a street segment (assuming looking from the "from" end toward the "to" end).
     */
    rangeRight: string;
    /**
     * The beginning point of a street segment: Latitude, Longitude
     */
    from: LatLonAPI;
    /**
     * The end point of a street segment: Latitude, Longitude
     */
    to: LatLonAPI;
};

/**
 * @ignore
 */
export type SummaryAPI = Omit<SearchSummary, 'geoBias'> & {
    geoBias?: LatLonAPI;
};

/**
 * @ignore
 */
export type CategoryAPI = { id: number };

/**
 * @ignore
 */
export type MomentAPI = {
    date: string;
    hour: number;
    minute: number;
};

/**
 * @ignore
 */
export type TimeRangeAPI = {
    startTime: MomentAPI;
    endTime: MomentAPI;
};

/**
 * @ignore
 */
export type OpeningHoursAPI = Omit<OpeningHours, 'alwaysOpenThisPeriod' | 'timeRanges'> & {
    timeRanges: TimeRangeAPI[];
};

/**
 * @ignore
 * place of interest api type.
 */
export type POIAPI = {
    name: string;
    phone?: string;
    brands?: Brand[];
    url?: string;
    // category ids
    categorySet?: CategoryAPI[];
    // Example: Array(2) [café/pub, internet café]
    categories?: string[];
    openingHours?: OpeningHoursAPI;
    classifications?: Classification[];
    timeZone?: TimeZone;
};

/**
 * @ignore
 */
export type ConnectorAPI = Omit<Connector, 'type'> & {
    connectorType: ConnectorType;
};

/**
 * @ignore
 */
export type ChargingParkAPI = {
    connectors: ConnectorAPI[];
};

/**
 * @ignore
 */
export type CommonSearchPlaceResultAPI = Omit<
    SearchPlaceProps,
    'distance' | 'position' | 'addressRanges' | 'geographyType' | 'entryPoints' | 'chargingPark'
> & {
    id: string;
    position: LatLonAPI;
    dist?: number;
    viewport?: ViewportAPI;
    boundingBox?: BoundingBoxAPI;
    entryPoints?: EntryPointAPI[];
    address?: AddressProperties;
    poi?: POIAPI;
    chargingPark?: ChargingParkAPI;
};
