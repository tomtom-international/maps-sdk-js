import { useCallback, useEffect, useRef, useState } from 'react';
import { incidentsFromRoutes } from '../agent/routeIncidents';
import type { IncidentsSnapshot } from './types';
import type { AgentInstance } from './useAgentBootstrap';

const EMPTY: IncidentsSnapshot = { label: '', items: [] };

/**
 * Incidents extracted from the ACTIVE monitored corridor (its on-route traffic sections), shaped as an
 * {@link IncidentsSnapshot} so the KPI strip and triage panel render them the same way as area incidents.
 * The active corridor is the one a route card last focused via `focusRoute` (its locate button points the
 * summary at that route); with none focused it falls back to the first monitored corridor. Empty when no
 * route monitor is running. Refreshes on each recalculation tick.
 */
export function useRouteIncidents(agent: AgentInstance | undefined) {
    const [routeIncidents, setRouteIncidents] = useState<IncidentsSnapshot>(EMPTY);
    // Entry the summary points at. null → follow the first monitored corridor. Held in a ref so
    // `focusRoute` and the routing listeners share one source without re-subscribing.
    const selectedIdRef = useRef<string | null>(null);
    const focusRouteRef = useRef<(entryId: string) => void>(() => {});

    useEffect(() => {
        if (!agent) return;
        const routing = agent.state.routing;

        const refresh = () => {
            const monitored = routing.entries.filter((e) => routing.isMonitored(e.id));
            if (monitored.length === 0) {
                selectedIdRef.current = null;
                setRouteIncidents(EMPTY);
                return;
            }
            // Focused corridor if it's still monitored, else the first one.
            const active =
                (selectedIdRef.current && monitored.find((e) => e.id === selectedIdRef.current)) || monitored[0];
            setRouteIncidents({ label: active.label, items: incidentsFromRoutes([active.data]) });
        };

        focusRouteRef.current = (entryId: string) => {
            selectedIdRef.current = entryId;
            refresh();
        };

        const unsubs = [
            routing.events.on('entries-change', refresh),
            routing.events.on('monitor-tick', refresh),
            routing.events.on('monitor-start', refresh),
            routing.events.on('monitor-stop', refresh),
        ];
        refresh();

        return () => {
            for (const unsub of unsubs) unsub();
            selectedIdRef.current = null;
            focusRouteRef.current = () => {};
            setRouteIncidents(EMPTY);
        };
    }, [agent]);

    // Point the summary/triage panels at a specific monitored corridor (the route card's locate button).
    const focusRoute = useCallback((entryId: string) => focusRouteRef.current(entryId), []);

    return { routeIncidents, focusRoute };
}
