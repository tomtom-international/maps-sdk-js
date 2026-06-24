import { useEffect, useState } from 'react';
import { clustersFromAnalysis } from '../agent/clusters';
import type { Cluster } from '../agent/types';
import type { AgentInstance } from './useAgentBootstrap';

/**
 * Materialise UI-ready clusters from the latest entry's dedicated clustering state.
 *
 * Clustering is typed first-class incidents state (`trafficIncidents.getClusters`), not a generic
 * analysis. Its monitor-tick re-run is async (a microtask after each tick), so the fresh result lands on
 * the slice's `clusters-change` event — NOT synchronously with `entries-change`. We re-derive on both:
 * `clusters-change` catches a fresh clustering result; `entries-change` catches the entry going away
 * (clear to empty). Reading on `entries-change` alone would show the previous tick's clusters.
 */
export function useClusters(agent: AgentInstance | undefined) {
    const [clusters, setClusters] = useState<readonly Cluster[]>([]);

    useEffect(() => {
        if (!agent) return;
        const recompute = () => {
            const entries = agent.state.trafficIncidents.entries;
            const latest = entries[entries.length - 1];
            if (!latest) {
                setClusters([]);
                return;
            }
            const data = agent.state.trafficIncidents.getClusters(latest.id);
            setClusters(data ? clustersFromAnalysis(data, latest.data) : []);
        };
        const unsubClusters = agent.state.trafficIncidents.events.on('clusters-change', recompute);
        const unsubEntries = agent.state.trafficIncidents.events.on('entries-change', recompute);
        return () => {
            unsubClusters();
            unsubEntries();
            setClusters([]);
        };
    }, [agent]);

    const clearClusters = () => {
        if (!agent) return;
        const entries = agent.state.trafficIncidents.entries;
        const latest = entries[entries.length - 1];
        if (latest) agent.state.trafficIncidents.clearClusters(latest.id);
        setClusters([]);
    };

    return { clusters, clearClusters };
}
