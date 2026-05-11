import { useEffect, useRef, useState } from 'react';
import { clustersFromAnalysis } from '../agent/clusters';
import type { Cluster } from '../agent/types';
import type { AgentInstance } from './useAgentBootstrap';

/**
 * Materialise UI-ready clusters from the latest entry's analysis registry.
 * Prefer the analysis literally named "clusters"; fall back to any json
 * analysis whose data parses into ≥1 cluster. Re-runs every entries-change so
 * the pins stay live as the toolkit re-polls.
 */
export function useClusters(agent: AgentInstance | undefined) {
    const [clusters, setClusters] = useState<readonly Cluster[]>([]);
    // Most-recently-bound clusters analysis name, so clearClusters can remove
    // whichever spec is currently driving the pins (it may not be "clusters").
    const clustersAnalysisNameRef = useRef<string | null>(null);

    useEffect(() => {
        if (!agent) return;
        const unsub = agent.state.trafficIncidents.events.on('entries-change', (entries) => {
            const latest = entries[entries.length - 1];
            if (!latest) {
                clustersAnalysisNameRef.current = null;
                setClusters([]);
                return;
            }
            const jsonAnalyses = latest._analyses?.results.filter((a) => a.outputFormat === 'json') ?? [];
            const namedMatch = jsonAnalyses.find((a) => a.name === 'clusters');
            const analysis =
                namedMatch ??
                jsonAnalyses.find((a) => {
                    if (!a.data || typeof a.data !== 'object') return false;
                    return 'groups' in a.data && Array.isArray((a.data as { groups: unknown }).groups);
                });
            if (!analysis) {
                clustersAnalysisNameRef.current = null;
                setClusters([]);
                return;
            }
            clustersAnalysisNameRef.current = analysis.name;
            setClusters(clustersFromAnalysis(analysis.data, latest.data));
        });
        return () => {
            unsub();
            clustersAnalysisNameRef.current = null;
            setClusters([]);
        };
    }, [agent]);

    const clearClusters = () => {
        if (!agent) return;
        const nameToRemove = clustersAnalysisNameRef.current ?? 'clusters';
        agent.state.trafficIncidents.removeAnalysisSpec(nameToRemove);
        clustersAnalysisNameRef.current = null;
        setClusters([]);
    };

    return { clusters, clearClusters };
}
