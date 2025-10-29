/**
 * Source identifier for POI (Point of Interest) vector tiles.
 *
 * @remarks
 * Used to reference the POI layer in the map style, which contains
 * business locations, landmarks, and other points of interest.
 *
 * @group POIs
 */
export const POI_SOURCE_ID = 'vectorTiles';

/**
 * Source identifier for hillshade terrain visualization.
 *
 * @remarks
 * References the raster source that provides terrain shading to visualize
 * elevation and topography on the map.
 *
 * @group Hillshade
 */
export const HILLSHADE_SOURCE_ID = 'hillshade';

/**
 * Source identifier prefix for places (geocoding results) features.
 *
 * @remarks
 * Combined with a unique identifier to create source IDs for place markers
 * displayed via the Places module.
 *
 * @group Places
 */
export const PLACES_SOURCE_PREFIX_ID = 'places';

/**
 * Source identifier for base map vector tiles.
 *
 * @remarks
 * References the primary vector tile source containing roads, buildings,
 * land use, water bodies, and other fundamental map features.
 *
 * @group Base Map
 */
export const BASE_MAP_SOURCE_ID = 'vectorTiles';

/**
 * Source identifier for traffic incidents vector tiles.
 *
 * @remarks
 * References the vector tile source containing real-time traffic incident data
 * such as accidents, road closures, and construction.
 *
 * @group Traffic Incidents
 */
export const TRAFFIC_INCIDENTS_SOURCE_ID = 'vectorTilesIncidents';

/**
 * Source identifier for traffic flow vector tiles.
 *
 * @remarks
 * References the vector tile source containing real-time traffic flow data
 * showing current traffic speeds and congestion levels.
 *
 * @group Traffic Flow
 */
export const TRAFFIC_FLOW_SOURCE_ID = 'vectorTilesFlow';
