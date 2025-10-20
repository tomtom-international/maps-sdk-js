/**
 * Data sources for fetching additional place information.
 *
 * Provides IDs that can be used with various services to retrieve
 * detailed or real-time information about a place.
 *
 * @remarks
 * This object acts as a navigation aid, telling you which additional
 * data is available for a place and providing the IDs needed to fetch it.
 *
 * @example
 * ```typescript
 * const dataSources: PlaceDataSources = {
 *   chargingAvailability: { id: 'charging-123' },
 *   geometry: { id: 'geom-456' },
 *   poiDetails: { id: 'poi-789', sourceName: 'TomTom' }
 * };
 * ```
 *
 * @group Place
 * @category Types
 */
export type PlaceDataSources = {
    /**
     * Data source for EV charging station availability.
     *
     * Present only for places that are EV charging stations (type === POI).
     * Use the ID to fetch real-time availability from the
     * EV Charging Stations Availability service.
     */
    chargingAvailability?: ChargingAvailabilityDataSource;

    /**
     * Data source for geometric shape information.
     *
     * Present for places with geometric representations (type === Geography or POI).
     * Use the ID to fetch boundary polygons from the Geometry Data service.
     *
     * @remarks
     * Useful for:
     * - Displaying administrative boundaries
     * - Showing building footprints
     * - Visualizing area coverage
     */
    geometry?: GeometryDataSource;

    /**
     * Data source for detailed POI information.
     *
     * Present only for POI places (type === POI).
     * Use the ID to fetch extended details from the Points of Interest Details service.
     */
    poiDetails?: PoiDetailsDataSource;
};

/**
 * Data source reference for EV charging availability.
 *
 * @example
 * ```typescript
 * // Use this ID with the EV Charging Stations Availability service
 * const dataSource: ChargingAvailabilityDataSource = {
 *   id: 'charging-park-123'
 * };
 * ```
 *
 * @group Place
 * @category Types
 */
export type ChargingAvailabilityDataSource = {
    /**
     * Charging availability ID for the EV Charging Stations Availability service.
     *
     * Pass this value as the chargingAvailability parameter to fetch
     * real-time status of charging points and connectors.
     */
    id?: string;
};

/**
 * Data source reference for geometric shape data.
 *
 * @example
 * ```typescript
 * // Use this ID with the Geometry Data service
 * const dataSource: GeometryDataSource = {
 *   id: 'geom-abc123'
 * };
 * ```
 *
 * @group Place
 * @category Types
 */
export type GeometryDataSource = {
    /**
     * Geometry ID for the Geometry Data service.
     *
     * Pass this value to fetch the geometric boundary (polygon or multipolygon)
     * representing the place's shape on the map.
     */
    id: string;
};

/**
 * Data source reference for detailed POI information.
 *
 * @example
 * ```typescript
 * const dataSource: PoiDetailsDataSource = {
 *   id: 'poi-xyz789',
 *   sourceName: 'TomTom'
 * };
 * ```
 *
 * @group Place
 * @category Types
 */
export type PoiDetailsDataSource = {
    /**
     * POI details ID for the Points of Interest Details service.
     *
     * Pass this value to fetch additional information such as:
     * - Extended opening hours
     * - Photos and ratings
     * - Detailed amenities
     * - Contact information
     */
    id: string;

    /**
     * Name of the data provider for this POI.
     *
     * Identifies the source of the POI information (e.g., 'TomTom', 'OSM').
     * Optional identifier for attribution or quality assessment.
     */
    sourceName?: string;
};
