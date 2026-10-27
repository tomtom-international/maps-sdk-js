import { bboxFromGeoJSON } from '@tomtom-org/maps-sdk/core';
import { useEffect, useState } from 'react';
import { monitoredRoutes as collectMonitoredRoutes, type MonitoredRoute } from '../agent/monitoredRoutes';
import { frameBounds } from '../utils/frameBounds';
import type { AgentInstance } from './useAgentBootstrap';

/**
 * Routing-side mirror of {@link useMonitor}: surfaces the corridors whose route
 * monitor is currently running, with each alternative's live travel time /
 * traffic delay, refreshed on every recalculation tick. The corridor's incidents
 * are not duplicated here: useRouteIncidents reads them from the route's own
 * traffic sections.
 */
export function useRouteMonitor(agent: AgentInstance | undefined) {
    const [monitoredRoutes, setMonitoredRoutes] = useState<MonitoredRoute[]>([]);
    const [routeLastTickAt, setRouteLastTickAt] = useState<number | null>(null);
    const [routeTickCount, setRouteTickCount] = useState(0);

    useEffect(() => {
        if (!agent) return;
        const routing = agent.state.routing;
        const unsubs: Array<() => void> = [];

        const refresh = () => setMonitoredRoutes(collectMonitoredRoutes(routing));

        unsubs.push(routing.events.on('monitor-start', refresh));
        unsubs.push(routing.events.on('monitor-stop', refresh));
        unsubs.push(
            routing.events.on('monitor-tick', ({ entryId }) => {
                if (!routing.isMonitored(entryId)) return;
                setRouteLastTickAt(Date.now());
                setRouteTickCount((n) => n + 1);
                refresh();
            }),
        );
        // Recalculations land via entries-change too — keep summaries fresh.
        unsubs.push(routing.events.on('entries-change', refresh));

        return () => {
            for (const unsub of unsubs) unsub();
            setMonitoredRoutes([]);
            setRouteLastTickAt(null);
            setRouteTickCount(0);
        };
    }, [agent]);

    // Frame a monitored corridor on the map — fit to the route geometry's bbox. Click a route card's
    // locate button to focus.
    const frameRoute = (entryId: string) => {
        if (!agent) return;
        const entry = agent.state.routing.entries.find((e) => e.id === entryId);
        if (!entry) return;
        const bbox = bboxFromGeoJSON(entry.data);
        if (!bbox) return;
        frameBounds(agent.state.baseMap.mapLibreMap, bbox);
    };

    // Stop one corridor's monitor — the Monitoring panel surfaces a route per card, so Stop is per-route.
    const stopRoute = (entryId: string) => {
        if (!agent) return;
        if (agent.state.routing.isMonitored(entryId)) agent.state.routing.stopMonitoring(entryId);
    };

    return {
        monitoredRoutes,
        routeLastTickAt,
        routeTickCount,
        frameRoute,
        stopRoute,
    };
}
