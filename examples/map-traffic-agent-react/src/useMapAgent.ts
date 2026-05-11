import { useAgentBootstrap } from './hooks/useAgentBootstrap';
import { useClusters } from './hooks/useClusters';
import { useClustersOverlay } from './hooks/useClustersOverlay';
import { useFocus } from './hooks/useFocus';
import { useHeatmapOverlay } from './hooks/useHeatmapOverlay';
import { useIncidents } from './hooks/useIncidents';
import { useMonitor } from './hooks/useMonitor';
import { useSelectedIncident } from './hooks/useSelectedIncident';
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
    const { agent, transport, isReady } = useAgentBootstrap(options);

    const { analyticsState } = useTrafficAnalytics(agent);
    const { selectedIncident, selectIncident, clearSelectedIncident } = useSelectedIncident(agent);
    const { incidents } = useIncidents(agent);
    const focus = useFocus(agent);
    const { clusters, clearClusters } = useClusters(agent);
    const monitor = useMonitor(agent);

    const { vizMode, setVizMode } = useHeatmapOverlay(agent, incidents);
    useClustersOverlay(agent, clusters, focus.focusCluster);

    return {
        agent,
        transport,
        isReady,
        analyticsState,
        selectedIncident,
        selectIncident,
        clearSelectedIncident,
        incidents,
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
        // monitor
        monitoredLabel: monitor.monitoredLabel,
        lastAnalysisAt: monitor.lastAnalysisAt,
        snapshotCount: monitor.snapshotCount,
        stopMonitor: monitor.stopMonitor,
        // viz
        vizMode,
        setVizMode,
    };
}
