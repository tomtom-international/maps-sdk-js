import type { AnalysisRecord } from '@tomtom-org/maps-sdk-plugin-agent-toolkit';
import { useEffect, useState } from 'react';
import type { AgentInstance } from './useAgentBootstrap';

/**
 * Surfaces every analysis the agent has registered via analyseData (one-shot or monitored), with
 * each one's latest result, for the right-rail Analyses panel. Re-reads on `analysis-change` (fires
 * whenever a result lands or a monitored analysis recomputes). `toggleMonitor` flips an analysis
 * between live (recomputes on source change) and off.
 */
export function useAnalyses(agent: AgentInstance | undefined) {
    const [analyses, setAnalyses] = useState<readonly AnalysisRecord[]>([]);

    useEffect(() => {
        if (!agent) return;
        const registry = agent.state.analyses;

        // all() returns the live record objects; snapshot into a new array so React sees a change.
        const refresh = () => setAnalyses([...registry.all()]);
        refresh();

        const unsub = registry.events.on('analysis-change', refresh);
        return () => {
            unsub();
            setAnalyses([]);
        };
    }, [agent]);

    const toggleMonitor = (analysisId: string, enabled: boolean) => {
        if (!agent) return;
        agent.state.analyses.setEnabled(analysisId, enabled);
        setAnalyses([...agent.state.analyses.all()]);
    };

    return { analyses, toggleMonitor };
}
