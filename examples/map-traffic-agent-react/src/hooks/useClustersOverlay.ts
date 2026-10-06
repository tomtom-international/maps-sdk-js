import { useEffect, useRef } from 'react';
import type { Cluster } from '../agent/types';
import { ClustersOverlay } from '../viz/ClustersOverlay';
import type { AgentInstance } from './useAgentBootstrap';

/**
 * Owns the ClustersOverlay (the pin layer) and keeps it in sync with the
 * cluster list. Click handler dispatches focus through the focus hook —
 * cluster ids may live in any entry, so the caller resolves the owning entry
 * itself.
 */
export function useClustersOverlay(
    agent: AgentInstance | undefined,
    clusters: readonly Cluster[],
    onClickCluster: (c: Cluster) => void,
) {
    const overlayRef = useRef<ClustersOverlay | null>(null);
    // The click handler captures `onClickCluster`. Stash the latest one in a
    // ref so we don't have to re-create the overlay every time the parent
    // passes a new closure.
    const handlerRef = useRef(onClickCluster);
    handlerRef.current = onClickCluster;

    useEffect(() => {
        if (!agent) return;
        const map = agent.state.baseMap.mapLibreMap;

        const onLoad = () => {
            overlayRef.current = new ClustersOverlay(map, {
                onClick: (c) => handlerRef.current(c),
            });
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

    useEffect(() => {
        overlayRef.current?.setClusters(clusters);
    }, [clusters]);
}
