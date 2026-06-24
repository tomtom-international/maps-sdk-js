import { useEffect, useState } from 'react';
import { incidentsFromRoutes } from '../agent/routeIncidents';
import type { IncidentsSnapshot } from './types';
import type { AgentInstance } from './useAgentBootstrap';

const EMPTY: IncidentsSnapshot = { label: '', items: [] };

/**
 * Incidents extracted from the currently-monitored route corridors (their on-route traffic
 * sections), shaped as an {@link IncidentsSnapshot} so the KPI strip and triage panel can render
 * them the same way as area incidents. Empty when no route monitor is running. Refreshes on each
 * recalculation tick.
 */
export function useRouteIncidents(agent: AgentInstance | undefined) {
    const [routeIncidents, setRouteIncidents] = useState<IncidentsSnapshot>(EMPTY);

    useEffect(() => {
        if (!agent) return;
        const routing = agent.state.routing;

        const refresh = () => {
            const monitored = routing.entries.filter((e) => routing.isMonitored(e.id));
            if (monitored.length === 0) {
                setRouteIncidents(EMPTY);
                return;
            }
            setRouteIncidents({
                label: monitored[0].label,
                items: incidentsFromRoutes(monitored.map((e) => e.data)),
            });
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
            setRouteIncidents(EMPTY);
        };
    }, [agent]);

    return { routeIncidents };
}
