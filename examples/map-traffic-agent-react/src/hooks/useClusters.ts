import { CLUSTER_ANALYSIS_NAME } from '@tomtom-org/maps-sdk-plugin-agent-toolkit';
import { useEffect, useState } from 'react';
import { clustersFromAnalysis } from '../agent/clusters';
import type { Cluster } from '../agent/types';
import type { AgentInstance } from './useAgentBootstrap';

/**
 * Materialise UI-ready clusters from the latest entry's `clusters` analysis.
 * Re-runs on every entries-change so the pins stay live as the toolkit re-polls
 * and the clustering spec replays.
 */
export function useClusters(agent: AgentInstance | undefined) {
    const [clusters, setClusters] = useState<readonly Cluster[]>([]);

    useEffect(() => {
        if (!agent) return;
        const unsub = agent.state.trafficIncidents.events.on('entries-change', (entries) => {
            const latest = entries[entries.length - 1];
            if (!latest) {
                setClusters([]);
                return;
            }
            const data = agent.state.trafficIncidents.getAnalysisResult(latest.id, CLUSTER_ANALYSIS_NAME);
            setClusters(data ? clustersFromAnalysis(data, latest.data) : []);
        });
        return () => {
            unsub();
            setClusters([]);
        };
    }, [agent]);

    const clearClusters = () => {
        if (!agent) return;
        agent.state.trafficIncidents.removeAnalysisSpec(CLUSTER_ANALYSIS_NAME);
        setClusters([]);
    };

    return { clusters, clearClusters };
}
