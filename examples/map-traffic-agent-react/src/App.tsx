import { useCallback, useEffect, useState } from 'react';
import { MapAgentChat } from './chat';
import { useAgentSettings } from './hooks/useAgentSettings';
import { AnalysesPanel } from './ui/AnalysesPanel';
import { AnalyticsControlPanel } from './ui/AnalyticsControlPanel';
import { ClusterPanel } from './ui/ClusterPanel';
import { FocusChip } from './ui/FocusChip';
import { IncidentDetailsPanel } from './ui/IncidentDetailsPanel';
import { NetworkKPIStrip } from './ui/NetworkKPIStrip';
import { OperationsPanel } from './ui/OperationsPanel';
import { TrackerToasts } from './ui/TrackerToasts';
import { TriagePanel } from './ui/TriagePanel';
import { useMapAgent } from './useMapAgent';

const WELCOME_TEXT = [
    '# Live Traffic Agent',
    'Monitor live traffic incidents, roadworks, and congested intersections across your network using highly accurate real-time traffic data.',
].join('\n\n');

const SUGGESTED_PROMPTS = [
    "Where's traffic worst in Berlin right now?",
    'Monitor traffic between Messe Berlin and Berlin Brandenburg Airport.',
    "How are the roads around Berlin's major hospitals right now?",
    'What can you do? Show me a few things I can ask.',
] as const;

const MIN_CHAT_WIDTH = 320; // px
const DEFAULT_CHAT_WIDTH = 380; // px — initial width; drag the handle to resize

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
        panelIncidents,
        focusOneIncident,
        focusMany,
        clusters,
        focusCluster,
        clearClusters,
        analyses,
        toggleAnalysisMonitor,
        summaryMonitored,
        lastAnalysisAt,
        snapshotCount,
        monitoredRoutes,
        stopRoute,
        focusRoute,
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

    // Drag-resizable chat width (desktop only). Capped at half the viewport — "to the middle".
    const [chatWidth, setChatWidth] = useState(DEFAULT_CHAT_WIDTH);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const mq = window.matchMedia('(max-width: 640px)');
        const update = () => setIsMobile(mq.matches);
        update();
        mq.addEventListener('change', update);
        return () => mq.removeEventListener('change', update);
    }, []);

    const startResize = useCallback((e: React.PointerEvent) => {
        e.preventDefault();
        document.body.style.userSelect = 'none';
        document.body.style.cursor = 'col-resize';
        // The chat sits on the left (flex-row-reverse); its left edge ≈ the 8px page padding, so the
        // dragged right edge gives the width. Clamp between a sensible min and half the viewport.
        const onMove = (ev: PointerEvent) => {
            const max = Math.max(MIN_CHAT_WIDTH, window.innerWidth / 2);
            setChatWidth(Math.min(Math.max(ev.clientX - 8, MIN_CHAT_WIDTH), max));
        };
        const onUp = () => {
            document.body.style.userSelect = '';
            document.body.style.cursor = '';
            window.removeEventListener('pointermove', onMove);
            window.removeEventListener('pointerup', onUp);
        };
        window.addEventListener('pointermove', onMove);
        window.addEventListener('pointerup', onUp);
    }, []);

    const focusedIdSet = new Set(focus?.ids ?? []);

    return (
        <div className="absolute inset-0 flex flex-row-reverse gap-2 bg-(--pb-surface-0) p-2 max-sm:flex-col max-sm:gap-0 max-sm:p-0">
            {/* `id="sdk-map"` is required — MapLibre attaches to the DOM node by ID. */}
            <div
                id="sdk-map"
                className="relative flex-1 overflow-hidden rounded-[20px] bg-(--pb-surface-1) max-sm:min-h-0 max-sm:basis-1/2 max-sm:rounded-none"
            >
                {/* MapLibre mounts into this inner element. Keeping it separate from the panel
                 * tree below preserves React-managed children — MapLibre wipes every child of
                 * its container, so panels rendered inside #sdk-map directly are silently
                 * removed on init. */}
                <div id="map-container" className="absolute inset-0" />
                {/* Overlay grid above the map. Left column = the panel rail (Figma places every panel
                 * on the left); it scrolls when the stack is tall. The right column is the open map, with
                 * the incident detail floating top and the map controls (focus, analytics) bottom. The
                 * grid AND its wrappers stay `pointer-events-none` so the map is clickable through every
                 * empty area; only the panels (`[&>*]:pointer-events-auto`) capture clicks. */}
                <div className="pointer-events-none absolute inset-0 z-(--pb-z-dropdown) grid grid-cols-[auto_minmax(0,1fr)] grid-rows-[minmax(0,1fr)_auto] gap-3 p-3 *:min-w-0">
                    {/* Left panel rail — monitoring chips, then the panels, stacked + scrollable. The rail
                        is the scroll container; `[&>*]:shrink-0` stops flexbox from squishing panels (which
                        would clip their content, e.g. the Summary tiles) so the rail scrolls instead. */}
                    <div
                        id="panel-rail"
                        className="no-scrollbar col-start-1 row-start-1 row-end-[-1] pointer-events-none -mb-3 flex min-h-0 max-w-[340px] flex-col items-start gap-2 overflow-y-auto [&>*]:shrink-0 [&>*]:pointer-events-auto"
                    >
                        <NetworkKPIStrip
                            incidents={panelIncidents.items}
                            label={panelIncidents.label}
                            monitored={summaryMonitored}
                            lastAnalysisAt={lastAnalysisAt}
                            snapshotCount={snapshotCount}
                        />
                        <OperationsPanel
                            areas={trackerAreas}
                            ungrouped={ungroupedTrackers}
                            routes={monitoredRoutes}
                            trackerCount={trackers.length}
                            events={trackerEvents}
                            lastSeenAt={trackerLastSeenAt}
                            onToggle={setTrackerEnabled}
                            onClear={clearTracker}
                            onFocusArea={focusTrackerArea}
                            onFocusRoute={focusRoute}
                            onStopRoute={stopRoute}
                            onSeen={markTrackersSeen}
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
                        <ClusterPanel
                            clusters={clusters}
                            focusedIds={focusedIdSet}
                            onFocusCluster={focusCluster}
                            onClearClusters={clearClusters}
                        />
                        <AnalysesPanel analyses={analyses} onToggleMonitor={toggleAnalysisMonitor} />
                    </div>

                    {/* Incident detail floats over the open map, top of the right column. */}
                    {selectedIncident && (
                        <div className="col-start-2 row-start-1 pointer-events-none flex min-h-0 justify-start self-start [&>*]:pointer-events-auto">
                            <IncidentDetailsPanel
                                incident={selectedIncident.incident}
                                overlapCount={selectedIncident.overlapCount}
                                onClose={clearSelectedIncident}
                            />
                        </div>
                    )}

                    {/* Map controls along the bottom of the open map. */}
                    <div className="col-start-2 row-start-2 pointer-events-none flex items-end justify-between gap-2 [&>*]:pointer-events-auto">
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
            {/* Chat column — fixed-but-resizable width on desktop, full width on mobile. */}
            <div className="relative flex shrink-0 max-sm:w-full" style={isMobile ? undefined : { width: chatWidth }}>
                {transport ? (
                    <MapAgentChat
                        transport={transport}
                        label="Live Traffic Agent"
                        welcomeText={WELCOME_TEXT}
                        suggestedPrompts={SUGGESTED_PROMPTS}
                        deploymentId={settings.deploymentId}
                        availableDeployments={availableDeployments}
                        onDeploymentChange={setDeploymentId}
                    />
                ) : (
                    <div className="w-full p-4 text-(--pb-text-medium)">Initializing assistant...</div>
                )}

                {/* Drag handle on the chat's inner (map-facing) edge — resize up to half the screen. */}
                {!isMobile && (
                    <div
                        role="separator"
                        aria-orientation="vertical"
                        aria-label="Resize chat"
                        onPointerDown={startResize}
                        className="group absolute top-0 right-0 z-20 flex h-full w-3 translate-x-1/2 cursor-col-resize items-center justify-center gap-0.5"
                    >
                        {/* Figma "Handle" — two 2px bars (text/low-em), 40px tall. */}
                        <span className="h-10 w-0.5 rounded-full bg-(--pb-text-low) transition-colors group-hover:bg-(--pb-primary-color)" />
                        <span className="h-10 w-0.5 rounded-full bg-(--pb-text-low) transition-colors group-hover:bg-(--pb-primary-color)" />
                    </div>
                )}
            </div>
        </div>
    );
}
