/**
 * @module agent-toolkit-tools/state
 *
 * State tools - operate purely on session state (places history, route history,
 * traffic-incidents history, staged waypoints, cached analytics) without calling any service.
 */

export {
    addByodLayerDescription,
    addByodLayerOutputSchema,
    addByodLayerSchema,
    executeAddByodLayer,
} from './add-byod-layer';
export {
    type AnalyseDataKind,
    type AnalyseDataScope,
    analyseDataBuilder,
    analyseDataDescription,
    analyseDataOutputSchema,
    analyseDataSchema,
    analyseDataScopeSchema,
    buildAnalyseDataCodeDoc,
    buildAnalyseDataDescription,
    buildAnalyseDataEntry,
    buildAnalyseDataSchema,
    executeAnalyseData,
} from './analyse-data';
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
    buildProcessDataCodeDoc,
    buildProcessDataDescription,
    buildProcessDataEntry,
    buildProcessDataSchema,
    executeProcessData,
    type ProcessDataKind,
    type ProcessDataScope,
    processDataBuilder,
    processDataDescription,
    processDataOutputSchema,
    processDataSchema,
    processDataScopeSchema,
} from './process-data';
export {
    executeQueryTrafficAnalytics,
    queryTrafficAnalyticsDescription,
    queryTrafficAnalyticsOutputSchema,
    queryTrafficAnalyticsSchema,
} from './query-traffic-analytics';
export {
    executeRecallByod,
    recallByodDescription,
    recallByodOutputSchema,
    recallByodSchema,
} from './recall-byod';
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
