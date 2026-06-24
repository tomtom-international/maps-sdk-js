import { useEffect, useRef, useState } from 'react';
import { HeatmapOverlay } from '../viz/HeatmapOverlay';
import type { VizMode } from '../viz/types';
import type { IncidentsSnapshot } from './types';
import type { AgentInstance } from './useAgentBootstrap';

/**
 * Owns the HeatmapOverlay for the example. Waits for the base style to load
 * before mounting (HeatmapOverlay touches the style's layer order), then keeps
 * the overlay's incident set in sync with the latest snapshot.
 */
export function useHeatmapOverlay(agent: AgentInstance | undefined, incidents: IncidentsSnapshot) {
    // Heatmap stays always-on; the manual toggle (VizToggle) was removed from the UI, but the overlay
    // itself remains the default visualisation.
    const [vizMode, setVizMode] = useState<VizMode>('heatmap');
    const overlayRef = useRef<HeatmapOverlay | null>(null);
    const vizModeRef = useRef<VizMode>(vizMode);
    vizModeRef.current = vizMode;

    useEffect(() => {
        if (!agent) return;
        const ttMap = agent.state.baseMap.ttMap;
        const map = ttMap.mapLibreMap;

        const onLoad = () => {
            const overlay = new HeatmapOverlay(ttMap);
            overlay.setMode(vizModeRef.current);
            overlayRef.current = overlay;
            // If incidents already arrived before style load, render them now.
            const allEntries = agent.state.trafficIncidents.entries;
            const latest = allEntries[allEntries.length - 1];
            if (latest) overlay.setIncidents(latest.data);
        };

        // If the style is already loaded (common when the agent is re-instantiated
        // without recreating the map), `load` won't fire again — mount immediately.
        if (map.isStyleLoaded()) {
            onLoad();
        } else {
            map.once('load', onLoad);
        }

        return () => {
            map.off('load', onLoad);
            overlayRef.current?.remove();
            overlayRef.current = null;
        };
    }, [agent]);

    // Sync overlay with the snapshot React already has — avoids a second
    // entries-change subscription competing with useIncidents for the source
    // of truth.
    useEffect(() => {
        overlayRef.current?.setIncidents(incidents.items);
    }, [incidents]);

    const applyVizMode = (m: VizMode) => {
        setVizMode(m);
        overlayRef.current?.setMode(m);
    };

    return { vizMode, setVizMode: applyVizMode };
}
