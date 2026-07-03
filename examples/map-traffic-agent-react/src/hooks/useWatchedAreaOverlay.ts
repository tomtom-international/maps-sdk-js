import { useEffect } from 'react';
import { WatchedAreaOverlay } from '../viz/WatchedAreaOverlay';
import type { AgentInstance } from './useAgentBootstrap';

/**
 * Owns the WatchedAreaOverlay (the green box + "Live · …" pill around each shown incident area). Waits
 * for the base style to load, then keeps the overlay in sync with the SHOWN entries — re-deriving on
 * `shown-change` (an entry is shown right after it's added) and `entries-change` (bbox/label updates).
 */
export function useWatchedAreaOverlay(agent: AgentInstance | undefined) {
    useEffect(() => {
        if (!agent) return;
        const slice = agent.state.trafficIncidents;
        const ttMap = agent.state.baseMap.ttMap;
        const map = ttMap.mapLibreMap;
        let overlay: WatchedAreaOverlay | null = null;

        const push = () => {
            if (!overlay) return;
            const shown = slice.shownEntryIds;
            const areas = slice.entries
                .filter((e) => shown.has(e.id))
                .map((e) => ({ id: e.id, bbox: e.params.bbox, label: e.label }));
            void overlay.setAreas(areas);
        };

        const onLoad = () => {
            overlay = new WatchedAreaOverlay(ttMap);
            push();
        };
        // If the style is already loaded (agent re-instantiated without recreating the map), `load`
        // won't fire again — mount immediately.
        if (map.isStyleLoaded()) onLoad();
        else map.once('load', onLoad);

        const unsubs = [slice.events.on('shown-change', push), slice.events.on('entries-change', push)];

        return () => {
            map.off('load', onLoad);
            for (const unsub of unsubs) unsub();
            overlay?.remove();
            overlay = null;
        };
    }, [agent]);
}
