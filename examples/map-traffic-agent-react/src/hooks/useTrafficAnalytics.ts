import { useEffect, useState } from 'react';
import type { AnalyticsState } from './types';
import type { AgentInstance } from './useAgentBootstrap';

/**
 * Mirror the toolkit's `trafficAreaAnalytics` events into React state so the
 * AnalyticsControlPanel can render the active area analysis.
 */
export function useTrafficAnalytics(agent: AgentInstance | undefined) {
    const [analyticsState, setAnalyticsState] = useState<AnalyticsState>(null);

    useEffect(() => {
        if (!agent) return;
        const unsubShown = agent.state.trafficAreaAnalytics.events.on('analytics-shown', ({ analytics, module }) => {
            setAnalyticsState({ analytics, module });
        });
        const unsubCleared = agent.state.trafficAreaAnalytics.events.on('analytics-cleared', () => {
            setAnalyticsState(null);
        });
        return () => {
            unsubShown();
            unsubCleared();
            setAnalyticsState(null);
        };
    }, [agent]);

    return { analyticsState };
}
