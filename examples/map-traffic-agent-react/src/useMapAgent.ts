import { useEffect, useRef, useState } from 'react';
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
import { useWatchedAreaOverlay } from './hooks/useWatchedAreaOverlay';

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
    const { agent, transport, isReady } = useAgentBootstrap(options);

    const { analyticsState } = useTrafficAnalytics(agent);
    const { selectedIncident, selectIncident, clearSelectedIncident } = useSelectedIncident(agent);
    const { incidents, entryId: panelEntryId, focusEntry } = useIncidents(agent);
    const focus = useFocus(agent);
    const { clusters, clearClusters } = useClusters(agent);
    const monitor = useMonitor(agent);
    const routeMonitor = useRouteMonitor(agent);
    const { routeIncidents, focusRoute: focusRouteIncidents } = useRouteIncidents(agent);
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

    // What the summary/triage panels follow: the last thing the operator focused. A watched area points
    // them at area incidents; a monitored corridor points them at that route's on-route incidents.
    const [focusKind, setFocusKind] = useState<'area' | 'route'>('area');
    const routeCountRef = useRef(0);
    useEffect(() => {
        const n = routeMonitor.monitoredRoutes.length;
        // A freshly-armed corridor takes over the summary; when the last one stops, fall back to areas.
        if (n > 0 && routeCountRef.current === 0) setFocusKind('route');
        else if (n === 0 && routeCountRef.current > 0) setFocusKind('area');
        routeCountRef.current = n;
    }, [routeMonitor.monitoredRoutes.length]);

    // Focusing a watched area frames it on the map AND points the summary/triage panels at that entry,
    // so the summary always reflects the area the operator last focused.
    const focusArea = (entryId: string) => {
        focusTrackerArea(entryId);
        focusEntry(entryId);
        setFocusKind('area');
    };

    // Focusing a monitored route frames the corridor on the map AND points the summary/triage panels at
    // that route's on-route incidents.
    const focusRoute = (entryId: string) => {
        routeMonitor.frameRoute(entryId);
        focusRouteIncidents(entryId);
        setFocusKind('route');
    };

    const { vizMode, setVizMode } = useHeatmapOverlay(agent, incidents);
    useClustersOverlay(agent, clusters, focus.focusCluster);
    useWatchedAreaOverlay(agent);
    useMonitoredRouteDisplay(agent);

    // The top/right panels follow whatever was last focused: a monitored corridor's on-route incidents
    // when a route is focused, otherwise the focused area's incidents. Same shape either way.
    const inRouteMode = routeMonitor.monitoredRoutes.length > 0;
    const showRoute = inRouteMode && focusKind === 'route';
    const panelIncidents = showRoute ? routeIncidents : incidents;

    // The summary's live-status (dot + "updated Ns ago · N") belongs to the monitored entry, but its
    // title/KPIs follow the focused/displayed entry. Only claim "live" when those are the SAME entry —
    // otherwise the chip would assert a focused area is refreshing when it's a different area's monitor
    // (and route-corridor incidents have no incident-area monitor at all).
    const summaryMonitored =
        !showRoute && monitor.monitoredEntryId != null && monitor.monitoredEntryId === panelEntryId;

    return {
        agent,
        transport,
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
        // monitor — `summaryMonitored` gates the summary card's live-status to the focused entry
        summaryMonitored,
        lastAnalysisAt: monitor.lastAnalysisAt,
        snapshotCount: monitor.snapshotCount,
        // route monitor (corridor mode)
        monitoredRoutes: routeMonitor.monitoredRoutes,
        routeMonitorLabel: routeMonitor.routeMonitorLabel,
        routeLastTickAt: routeMonitor.routeLastTickAt,
        routeTickCount: routeMonitor.routeTickCount,
        stopRoute: routeMonitor.stopRoute,
        stopRouteMonitor: routeMonitor.stopRouteMonitor,
        focusRoute,
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
        focusTrackerArea: focusArea,
    };
}
