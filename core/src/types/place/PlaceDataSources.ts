export type PlaceDataSources = {
    /**
     * Information about the charging stations availability. Only present if type == POI.
     */
    chargingAvailability?: ChargingAvailabilityDataSource;

    /**
     * Information about the geometric shape of the result. Only present if type == Geography or POI.
     */
    geometry?: GeometryDataSource;

    /**
     * Additional data about POI. Only present if type == POI.
     */
    poiDetails?: PoiDetailsDataSource;
};

export type ChargingAvailabilityDataSource = {
    /**
     * Pass this as chargingAvailability to the EV Charging Stations Availability service to fetch charging availability information for this result.
     */
    id?: string;
};

export type GeometryDataSource = {
    /**
     * Pass this as geometryId to the Additional Data service to fetch geometry information for this result.
     */
    id?: string;
};

export type PoiDetailsDataSource = {
    /**
     * Pass this as id to the Points of Interest Details service to fetch additional data for the POI.
     */
    id?: string;

    /**
     * Name of an additional data provider.
     */
    sourceName?: string;
};
