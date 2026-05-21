import { useEffect, useState } from 'react';
import type { AnalyticsState } from './types';
import type { AgentInstance } from './useAgentBootstrap';

/**
 * Mirror the toolkit's `trafficAreaAnalytics` events into React state so the
 * AnalyticsControlPanel can render the currently-shown area analysis. The
 * slice is per-entry now — we react to `shown-change` and pick the latest
 * shown entry, lazy-fetching its module for the control panel.
 */
export function useTrafficAnalytics(agent: AgentInstance | undefined) {
    const [analyticsState, setAnalyticsState] = useState<AnalyticsState>(null);

    useEffect(() => {
        if (!agent) return;

        const slice = agent.state.trafficAreaAnalytics;

        const syncLatestShown = async (shownIds: ReadonlySet<string>) => {
            if (shownIds.size === 0) {
                setAnalyticsState(null);
                return;
            }
            const entries = slice.entries;
            // Newest-first scan picks the most recent rendered entry — that's the one the
            // control panel should be bound to.
            const latest = [...entries].reverse().find((e) => shownIds.has(e.id));
            if (!latest) {
                setAnalyticsState(null);
                return;
            }
            const module = await slice.getEntryModule(latest.id);
            setAnalyticsState({ analytics: latest.data, module });
        };

        const unsubShown = slice.events.on('shown-change', syncLatestShown);
        // Sync once on mount in case an entry is already showing when the hook attaches.
        void syncLatestShown(slice.shownEntryIds);

        return () => {
            unsubShown();
            setAnalyticsState(null);
        };
    }, [agent]);

    return { analyticsState };
}
