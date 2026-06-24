import { useAgentBootstrap } from './hooks/useAgentBootstrap';
import { useAnalyses } from './hooks/useAnalyses';
import { useClusters } from './hooks/useClusters';
import { useClustersOverlay } from './hooks/useClustersOverlay';
import { useFocus } from './hooks/useFocus';
import { useHeatmapOverlay } from './hooks/useHeatmapOverlay';
import { useIncidents } from './hooks/useIncidents';
import { useMonitor } from './hooks/useMonitor';
import { useMonitoredRouteDisplay } from './hooks/useMonitoredRouteDisplay';
import { useRouteIncidents } from './hooks/useRouteIncidents';
import { useRouteMonitor } from './hooks/useRouteMonitor';
import { useSelectedIncident } from './hooks/useSelectedIncident';
import { useTrackers } from './hooks/useTrackers';
import { useTrafficAnalytics } from './hooks/useTrafficAnalytics';

export type { AnalyticsState, FocusState, IncidentsSnapshot, SelectedIncident } from './hooks/types';

type UseMapAgentOptions = {
    deploymentId: string;
};

/**
 * Top-level composition for the example. Each concern (agent lifecycle,
 * incidents, focus, monitor, clusters, overlays) owns its own hook so the file
 * tree mirrors the panel tree in App.tsx.
 */
export function useMapAgent(options: UseMapAgentOptions) {
    const { agent, transport, classifications, isReady } = useAgentBootstrap(options);

    const { analyticsState } = useTrafficAnalytics(agent);
    const { selectedIncident, selectIncident, clearSelectedIncident } = useSelectedIncident(agent);
    const { incidents } = useIncidents(agent);
    const focus = useFocus(agent);
    const { clusters, clearClusters } = useClusters(agent);
    const monitor = useMonitor(agent);
    const routeMonitor = useRouteMonitor(agent);
    const { routeIncidents } = useRouteIncidents(agent);
    const { analyses, toggleMonitor } = useAnalyses(agent);
    const {
        trackers,
        areas: trackerAreas,
        ungrouped: ungroupedTrackers,
        events: trackerEvents,
        toasts: trackerToasts,
        dismissToast,
        lastSeenAt: trackerLastSeenAt,
        markSeen: markTrackersSeen,
        setEnabled: setTrackerEnabled,
        clearTracker,
        focusArea: focusTrackerArea,
    } = useTrackers(agent);

    const { vizMode, setVizMode } = useHeatmapOverlay(agent, incidents);
    useClustersOverlay(agent, clusters, focus.focusCluster);
    useMonitoredRouteDisplay(agent);

    // While a corridor is monitored, the top/right panels read the on-route incidents extracted
    // from the routes; otherwise they read the area incidents. Same shape either way.
    const panelIncidents = routeIncidents.items.length > 0 ? routeIncidents : incidents;

    return {
        agent,
        transport,
        classifications,
        isReady,
        analyticsState,
        selectedIncident,
        selectIncident,
        clearSelectedIncident,
        incidents,
        // incidents shown in the top/right panels (route-corridor incidents when monitoring routes)
        panelIncidents,
        // focus
        focus: focus.focus,
        focusIndex: focus.focusIndex,
        focusPrev: focus.focusPrev,
        focusNext: focus.focusNext,
        clearFocus: focus.clearFocus,
        focusOneIncident: focus.focusOneIncident,
        focusMany: focus.focusMany,
        focusCluster: focus.focusCluster,
        // clusters
        clusters,
        clearClusters,
        // analyses (analyseData results + charts)
        analyses,
        toggleAnalysisMonitor: toggleMonitor,
        // monitor
        monitoredLabel: monitor.monitoredLabel,
        lastAnalysisAt: monitor.lastAnalysisAt,
        snapshotCount: monitor.snapshotCount,
        stopMonitor: monitor.stopMonitor,
        // route monitor (corridor mode)
        monitoredRoutes: routeMonitor.monitoredRoutes,
        routeMonitorLabel: routeMonitor.routeMonitorLabel,
        routeLastTickAt: routeMonitor.routeLastTickAt,
        routeTickCount: routeMonitor.routeTickCount,
        stopRouteMonitor: routeMonitor.stopRouteMonitor,
        // viz
        vizMode,
        setVizMode,
        // trackers
        trackers,
        trackerAreas,
        ungroupedTrackers,
        trackerEvents,
        trackerToasts,
        dismissToast,
        trackerLastSeenAt,
        markTrackersSeen,
        setTrackerEnabled,
        clearTracker,
        focusTrackerArea,
    };
}
