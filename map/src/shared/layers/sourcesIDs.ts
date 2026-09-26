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
 * Source identifier of the style's elevation data, added by the `hillshade` style part.
 *
 * @remarks
 * A raster-dem source, drawn as the hillshade layer. {@link TerrainModule} raises the 3D surface
 * from a copy of it, {@link TERRAIN_SOURCE_ID}.
 *
 * @group Terrain
 */
export const HILLSHADE_SOURCE_ID = 'hillshade';

/**
 * Source identifier of the 3D terrain surface: a copy of {@link HILLSHADE_SOURCE_ID} that
 * {@link TerrainModule} adds when elevation is first enabled.
 *
 * @remarks
 * MapLibre renders hillshade and 3D terrain at a lower quality when both share one source.
 *
 * @group Terrain
 */
export const TERRAIN_SOURCE_ID = 'hillshade-terrain';

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
