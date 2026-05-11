import { MapAgentChat } from './chat/MapAgentChat';
import { useAgentSettings } from './hooks/useAgentSettings';
import { AnalyticsControlPanel } from './ui/AnalyticsControlPanel';
import { ClusterPanel } from './ui/ClusterPanel';
import { FocusChip } from './ui/FocusChip';
import { IncidentDetailsPanel } from './ui/IncidentDetailsPanel';
import { MonitoredAreaChip } from './ui/MonitoredAreaChip';
import { NetworkKPIStrip } from './ui/NetworkKPIStrip';
import { TriagePanel } from './ui/TriagePanel';
import { VizToggle } from './ui/VizToggle';
import { useMapAgent } from './useMapAgent';

export function App() {
    const { settings, setDeploymentId, availableDeployments } = useAgentSettings();

    const {
        transport,
        analyticsState,
        selectedIncident,
        selectIncident,
        clearSelectedIncident,
        focus,
        focusIndex,
        focusPrev,
        focusNext,
        clearFocus,
        incidents,
        vizMode,
        setVizMode,
        focusOneIncident,
        focusMany,
        clusters,
        focusCluster,
        clearClusters,
        stopMonitor,
        monitoredLabel,
        lastAnalysisAt,
        snapshotCount,
    } = useMapAgent({
        deploymentId: settings.deploymentId,
    });

    const focusedIdSet = new Set(focus?.ids ?? []);

    return (
        <div id="app">
            <div id="sdk-map">
                {/* MapLibre mounts into this inner element. Keeping it separate from the
                 * panel tree below preserves React-managed children — MapLibre wipes every
                 * child of its container, so panels rendered inside #sdk-map directly are
                 * silently removed on init. */}
                <div id="map-container" />
                <div className="map-overlays">
                    <div className="map-overlays__top-left">
                        <div className="map-overlays__top-left-row">
                            <NetworkKPIStrip incidents={incidents.items} label={incidents.label} />
                            <VizToggle mode={vizMode} onChange={setVizMode} />
                        </div>
                        <MonitoredAreaChip
                            label={monitoredLabel}
                            lastAnalysisAt={lastAnalysisAt}
                            snapshotCount={snapshotCount}
                            onClear={stopMonitor}
                        />
                    </div>

                    {selectedIncident && (
                        <IncidentDetailsPanel
                            incident={selectedIncident.incident}
                            overlapCount={selectedIncident.overlapCount}
                            onClose={clearSelectedIncident}
                        />
                    )}

                    <div className="map-overlays__right">
                        <ClusterPanel
                            clusters={clusters}
                            focusedIds={focusedIdSet}
                            onFocusCluster={focusCluster}
                            onClearClusters={clearClusters}
                        />
                        {incidents.items.length > 0 && (
                            <TriagePanel
                                incidents={incidents.items}
                                focusedIds={focusedIdSet}
                                onFocusIncident={focusOneIncident}
                                onSelectIncident={selectIncident}
                                onFocusMany={focusMany}
                                onClearFocus={() => clearFocus?.()}
                            />
                        )}
                    </div>

                    <div className="map-overlays__bottom-left">
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
            </div>
            {transport ? (
                <MapAgentChat
                    transport={transport}
                    deploymentId={settings.deploymentId}
                    availableDeployments={availableDeployments}
                    onDeploymentChange={setDeploymentId}
                />
            ) : (
                <div id="chat-panel">
                    <div id="chat-loading">Initializing assistant...</div>
                </div>
            )}
        </div>
    );
}
