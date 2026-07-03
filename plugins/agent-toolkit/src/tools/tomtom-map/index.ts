/**
 * @module agent-toolkit-tools/tomtom-map
 *
 * TomTom Map tools - operations for showing routes, places, toggling POIs, traffic, etc.
 */

export {
    clearMapDescription,
    clearMapOutputSchema,
    clearMapSchema,
    executeClearMap,
} from './clear-map';
export {
    executeGetStandardMapStyles,
    getStandardMapStylesDescription,
    getStandardMapStylesOutputSchema,
    getStandardMapStylesSchema,
} from './get-standard-map-styles';
export {
    executeSetLanguage,
    setLanguageDescription,
    setLanguageOutputSchema,
    setLanguageSchema,
} from './set-language';
export {
    executeSetMapStandardStyle,
    setMapStandardStyleDescription,
    setMapStandardStyleOutputSchema,
    setMapStandardStyleSchema,
} from './set-map-standard-style';
export {
    executeToggleTilesBaseMapLayerGroups,
    toggleTilesBaseMapLayerGroupsDescription,
    toggleTilesBaseMapLayerGroupsOutputSchema,
    toggleTilesBaseMapLayerGroupsSchema,
} from './toggle-tiles-base-map-layer-groups';
export {
    executeToggleTilesPOIs,
    toggleTilesPOIsDescription,
    toggleTilesPOIsOutputSchema,
    toggleTilesPOIsSchema,
} from './toggle-tiles-pois';
export {
    executeToggleTilesTrafficFlow,
    executeToggleTilesTrafficIncidents,
    toggleTilesTrafficFlowDescription,
    toggleTilesTrafficFlowOutputSchema,
    toggleTilesTrafficFlowSchema,
    toggleTilesTrafficIncidentsDescription,
    toggleTilesTrafficIncidentsOutputSchema,
    toggleTilesTrafficIncidentsSchema,
} from './toggle-tiles-traffic';
export {
    executeUpdateByodDisplay,
    updateByodDisplayDescription,
    updateByodDisplayOutputSchema,
    updateByodDisplaySchema,
} from './update-byod-display';
export {
    executeUpdatePlacesDisplay,
    updatePlacesDisplayDescription,
    updatePlacesDisplayOutputSchema,
    updatePlacesDisplaySchema,
} from './update-places-display';
export {
    executeUpdateRoutesDisplay,
    updateRoutesDisplayDescription,
    updateRoutesDisplayOutputSchema,
    updateRoutesDisplaySchema,
} from './update-routes-display';
export {
    executeUpdateTrafficAreaAnalyticsDisplay,
    updateTrafficAreaAnalyticsDisplayDescription,
    updateTrafficAreaAnalyticsDisplayOutputSchema,
    updateTrafficAreaAnalyticsDisplaySchema,
} from './update-traffic-area-analytics-display';
export {
    executeUpdateWaypointsDisplay,
    updateWaypointsDisplayDescription,
    updateWaypointsDisplayOutputSchema,
    updateWaypointsDisplaySchema,
} from './update-waypoints-display';
