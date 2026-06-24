import { MapAgentChat } from './chat';
import { useAgentSettings } from './hooks/useAgentSettings';
import { AnalysesPanel } from './ui/AnalysesPanel';
import { AnalyticsControlPanel } from './ui/AnalyticsControlPanel';
import { ClusterPanel } from './ui/ClusterPanel';
import { FocusChip } from './ui/FocusChip';
import { IncidentDetailsPanel } from './ui/IncidentDetailsPanel';
import { NetworkKPIStrip } from './ui/NetworkKPIStrip';
import { OperationsPanel } from './ui/OperationsPanel';
import { RouteMonitorPanel } from './ui/RouteMonitorPanel';
import { TrackerToasts } from './ui/TrackerToasts';
import { TriagePanel } from './ui/TriagePanel';
import { useMapAgent } from './useMapAgent';

const WELCOME_TEXT = [
    "I'm your **live traffic operations** partner — ask me what's happening on the network right now, where the biggest slowdowns are, or to triage a specific work zone, route, or area you're watching.",
    '&nbsp;',
    '🧪 *Experimental feature.*',
].join('\n\n');

const SUGGESTED_PROMPTS = [
    "What's happening on London's roads right now?",
    'Monitor traffic between Heathrow and the City of London',
    'Watch the City of London and alert me if a major incident appears',
    "How are the roads around London's main hospitals right now?",
    "Is the traffic I'm looking at normal for this time of day?",
    'Summarise the 3 biggest slowdown clusters in London',
] as const;

export function App() {
    const { settings, setDeploymentId, availableDeployments } = useAgentSettings();

    const {
        transport,
        classifications,
        analyticsState,
        selectedIncident,
        selectIncident,
        clearSelectedIncident,
        focus,
        focusIndex,
        focusPrev,
        focusNext,
        clearFocus,
        panelIncidents,
        focusOneIncident,
        focusMany,
        clusters,
        focusCluster,
        clearClusters,
        analyses,
        toggleAnalysisMonitor,
        monitoredRoutes,
        routeLastTickAt,
        stopRouteMonitor,
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
    } = useMapAgent({
        deploymentId: settings.deploymentId,
    });

    const focusedIdSet = new Set(focus?.ids ?? []);

    return (
        <div className="absolute inset-0 flex flex-row-reverse gap-2 bg-(--sdk-surface-0) p-2 max-sm:flex-col max-sm:gap-0 max-sm:p-0">
            {/* `id="sdk-map"` is required — MapLibre attaches to the DOM node by ID. */}
            <div
                id="sdk-map"
                className="relative flex-1 overflow-hidden rounded-[20px] bg-(--sdk-surface-1) max-sm:min-h-0 max-sm:basis-1/2 max-sm:rounded-none"
            >
                {/* MapLibre mounts into this inner element. Keeping it separate from the panel
                 * tree below preserves React-managed children — MapLibre wipes every child of
                 * its container, so panels rendered inside #sdk-map directly are silently
                 * removed on init. */}
                <div id="map-container" className="absolute inset-0" />
                {/* Grid container that owns every overlay panel above the map. Cols: fluid left
                 * / fixed 320px right rail. Rows: top auto / middle fluid / bottom auto. Children
                 * get pointer-events:auto via the `*:` variant; the grid itself is transparent. */}
                <div className="pointer-events-none absolute inset-0 z-(--sdk-z-dropdown) grid grid-cols-[minmax(0,1fr)_320px] grid-rows-[auto_minmax(0,1fr)_auto] gap-x-3 gap-y-2 p-3 *:pointer-events-auto *:min-w-0">
                    <div className="col-start-1 row-start-1 flex min-h-0 min-w-0 flex-col items-start gap-2">
                        <NetworkKPIStrip incidents={panelIncidents.items} label={panelIncidents.label} />
                        <RouteMonitorPanel
                            routes={monitoredRoutes}
                            lastTickAt={routeLastTickAt}
                            onStop={stopRouteMonitor}
                        />
                        <OperationsPanel
                            areas={trackerAreas}
                            ungrouped={ungroupedTrackers}
                            trackerCount={trackers.length}
                            events={trackerEvents}
                            lastSeenAt={trackerLastSeenAt}
                            onToggle={setTrackerEnabled}
                            onClear={clearTracker}
                            onFocusArea={focusTrackerArea}
                            onSeen={markTrackersSeen}
                        />
                    </div>

                    {selectedIncident && (
                        <IncidentDetailsPanel
                            incident={selectedIncident.incident}
                            overlapCount={selectedIncident.overlapCount}
                            onClose={clearSelectedIncident}
                        />
                    )}

                    <div className="col-start-2 row-start-1 row-end-[-1] flex min-h-0 flex-col gap-2">
                        <ClusterPanel
                            clusters={clusters}
                            focusedIds={focusedIdSet}
                            onFocusCluster={focusCluster}
                            onClearClusters={clearClusters}
                        />
                        {panelIncidents.items.length > 0 && (
                            <TriagePanel
                                incidents={panelIncidents.items}
                                focusedIds={focusedIdSet}
                                onFocusIncident={focusOneIncident}
                                onSelectIncident={selectIncident}
                                onFocusMany={focusMany}
                                onClearFocus={() => clearFocus?.()}
                            />
                        )}
                        <AnalysesPanel analyses={analyses} onToggleMonitor={toggleAnalysisMonitor} />
                    </div>

                    <div className="col-start-1 row-start-3 flex min-w-0 flex-col items-start gap-2">
                        {focus && (
                            <FocusChip
                                count={focus.ids.length}
                                currentIndex={focusIndex}
                                reason={focus.reason}
                                onPrev={focusPrev}
                                onNext={focusNext}
                                onClear={clearFocus}
                            />
                        )}
                        {analyticsState && (
                            <AnalyticsControlPanel
                                analytics={analyticsState.analytics}
                                module={analyticsState.module}
                            />
                        )}
                    </div>
                </div>
                <TrackerToasts toasts={trackerToasts} onDismiss={dismissToast} />
            </div>
            {transport ? (
                <MapAgentChat
                    transport={transport}
                    label="Live Traffic Agent"
                    welcomeText={WELCOME_TEXT}
                    suggestedPrompts={SUGGESTED_PROMPTS}
                    deploymentId={settings.deploymentId}
                    availableDeployments={availableDeployments}
                    onDeploymentChange={setDeploymentId}
                    classifications={classifications}
                />
            ) : (
                <div className="flex w-[380px] flex-col bg-(--sdk-surface-0) max-sm:w-full">
                    <div className="p-4 text-(--sdk-text-medium)">Initializing assistant...</div>
                </div>
            )}
        </div>
    );
}
