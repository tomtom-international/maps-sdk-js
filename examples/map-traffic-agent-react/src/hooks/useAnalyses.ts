import type { AnalysisRecord } from '@tomtom-org/maps-sdk-plugin-agent-toolkit';
import { useEffect, useState } from 'react';
import type { AgentInstance } from './useAgentBootstrap';

/** An analysis record plus whether its job is currently monitoring (recomputing on source change). */
export type AnalysisView = AnalysisRecord & { monitored: boolean };

/**
 * Surfaces every analysis the agent has registered via analyseData (one-shot or monitored), with
 * each one's latest result, for the right-rail Analyses panel. Re-reads on `analysis-change` (fires
 * whenever a result lands or a monitored analysis recomputes). `toggleMonitor` flips an analysis
 * between live (recomputes on source change) and off by pausing/resuming its job.
 */
export function useAnalyses(agent: AgentInstance | undefined) {
    const [analyses, setAnalyses] = useState<readonly AnalysisView[]>([]);

    useEffect(() => {
        if (!agent) return;
        const registry = agent.state.analyses;

        // Snapshot into a new array so React sees a change; tag each with its live monitoring state.
        const refresh = () =>
            setAnalyses(registry.all().map((r) => ({ ...r, monitored: registry.isMonitored(r.analysisId) })));
        refresh();

        const unsub = registry.events.on('analysis-change', refresh);
        return () => {
            unsub();
            setAnalyses([]);
        };
    }, [agent]);

    const toggleMonitor = (analysisId: string, enabled: boolean) => {
        if (!agent) return;
        const registry = agent.state.analyses;
        registry.job(analysisId)?.setActive(enabled);
        setAnalyses(registry.all().map((r) => ({ ...r, monitored: registry.isMonitored(r.analysisId) })));
    };

    return { analyses, toggleMonitor };
}
