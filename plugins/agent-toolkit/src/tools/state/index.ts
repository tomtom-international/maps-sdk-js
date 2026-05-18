/**
 * @module agent-toolkit-tools/state
 *
 * State tools - operate purely on session state (places history, route history,
 * traffic-incidents history, staged waypoints, cached analytics) without calling any service.
 */

export {
    analyseGeometriesDescription,
    analyseGeometriesOutputSchema,
    analyseGeometriesSchema,
    executeAnalyseGeometries,
} from './analyse-geometries';
export {
    analyseIncidentsDescription,
    analyseIncidentsOutputSchema,
    analyseIncidentsSchema,
    executeAnalyseIncidents,
} from './analyse-incidents';
export {
    analysePlacesBuilder,
    analysePlacesDescription,
    analysePlacesOutputSchema,
    analysePlacesSchema,
    buildAnalysePlacesEntry,
    buildAnalysePlacesSchema,
    executeAnalysePlaces,
} from './analyse-places';
export {
    analyseRoutesDescription,
    analyseRoutesOutputSchema,
    analyseRoutesSchema,
    executeAnalyseRoutes,
} from './analyse-routes';
export {
    executeFocusIncidents,
    focusIncidentsDescription,
    focusIncidentsOutputSchema,
    focusIncidentsSchema,
} from './focus-incidents';
export {
    executeGetCurrentWaypoints,
    getCurrentWaypointsDescription,
    getCurrentWaypointsOutputSchema,
    getCurrentWaypointsSchema,
} from './get-current-waypoints';
export {
    executeProcessGeometries,
    processGeometriesDescription,
    processGeometriesOutputSchema,
    processGeometriesSchema,
} from './process-geometries';
export {
    buildExecuteProcessPlaces,
    buildProcessPlacesEntry,
    buildProcessPlacesOutputSchema,
    buildProcessPlacesSchema,
    executeProcessPlaces,
    processPlacesBuilder,
    processPlacesDescription,
    processPlacesOutputSchema,
    processPlacesSchema,
} from './process-places';
export {
    executeProcessRoutes,
    processRoutesDescription,
    processRoutesOutputSchema,
    processRoutesSchema,
} from './process-routes';
export {
    executeQueryTrafficAnalytics,
    queryTrafficAnalyticsDescription,
    queryTrafficAnalyticsOutputSchema,
    queryTrafficAnalyticsSchema,
} from './query-traffic-analytics';
export {
    executeRecallGeometries,
    recallGeometriesDescription,
    recallGeometriesOutputSchema,
    recallGeometriesSchema,
} from './recall-geometries';
export {
    buildExecuteRecallPlaces,
    buildRecallPlacesEntry,
    buildRecallPlacesOutputSchema,
    executeRecallPlaces,
    recallPlacesBuilder,
    recallPlacesDescription,
    recallPlacesOutputSchema,
    recallPlacesSchema,
} from './recall-places';
export {
    executeRecallRanges,
    recallRangesDescription,
    recallRangesOutputSchema,
    recallRangesSchema,
} from './recall-ranges';
export {
    executeRecallRoutes,
    recallRoutesDescription,
    recallRoutesOutputSchema,
    recallRoutesSchema,
} from './recall-routes';
export {
    executeRecallState,
    recallStateDescription,
    recallStateOutputSchema,
    recallStateSchema,
} from './recall-state';
export {
    executeResetState,
    resetStateDescription,
    resetStateOutputSchema,
    resetStateSchema,
} from './reset-state';
export {
    executeSetEntryMode,
    setEntryModeDescription,
    setEntryModeOutputSchema,
    setEntryModeSchema,
} from './set-entry-mode';
export {
    executeStartTrafficIncidentsMonitor,
    startTrafficIncidentsMonitorDescription,
    startTrafficIncidentsMonitorOutputSchema,
    startTrafficIncidentsMonitorSchema,
} from './start-traffic-incidents-monitor';
export {
    executeStopTrafficIncidentsMonitor,
    stopTrafficIncidentsMonitorDescription,
    stopTrafficIncidentsMonitorOutputSchema,
    stopTrafficIncidentsMonitorSchema,
} from './stop-traffic-incidents-monitor';
