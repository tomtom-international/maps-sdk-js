import type { Routes } from '@tomtom-org/maps-sdk/core';
import { useEffect, useRef, useState } from 'react';
import type { AgentInstance } from './useAgentBootstrap';

type RouteFeature = Routes['features'][number];

/** One alternative of a monitored corridor, with its live-traffic summary. */
export type RouteAlternative = {
    index: number;
    travelTimeInSeconds: number;
    trafficDelayInSeconds: number;
    lengthInMeters: number;
    trafficLengthInMeters: number;
    arrivalTime: number; // epoch ms
};

/** A monitored route entry surfaced for the RouteMonitorPanel. */
export type MonitoredRoute = {
    entryId: string;
    label: string;
    alternatives: RouteAlternative[];
    lastTickAt: number;
};

/**
 * Routing-side mirror of {@link useMonitor}: surfaces the corridors whose route
 * monitor is currently running, with each alternative's live travel time /
 * traffic delay, refreshed on every recalculation tick. The corridor's incident
 * insights are not duplicated here — they ride the trafficIncidents slice
 * (useIncidents + useMonitor) via the corridor `getTrafficIncidents` fetch.
 */
export function useRouteMonitor(agent: AgentInstance | undefined) {
    const [monitoredRoutes, setMonitoredRoutes] = useState<MonitoredRoute[]>([]);
    const [routeLastTickAt, setRouteLastTickAt] = useState<number | null>(null);
    const [routeTickCount, setRouteTickCount] = useState(0);
    // Ids of entries whose monitor is currently running.
    const activeIdsRef = useRef<Set<string>>(new Set());

    useEffect(() => {
        if (!agent) return;
        const routing = agent.state.routing;
        const unsubs: Array<() => void> = [];

        const refresh = () => {
            const ids = activeIdsRef.current;
            const routes: MonitoredRoute[] = [];
            for (const entry of routing.entries) {
                if (!ids.has(entry.id)) continue;
                routes.push({
                    entryId: entry.id,
                    label: entry.label,
                    lastTickAt: entry.timestamp,
                    alternatives: entry.data.features.map((feature: RouteFeature) => {
                        const { index, summary } = feature.properties;
                        return {
                            index,
                            travelTimeInSeconds: summary.travelTimeInSeconds,
                            trafficDelayInSeconds: summary.trafficDelayInSeconds,
                            lengthInMeters: summary.lengthInMeters,
                            trafficLengthInMeters: summary.trafficLengthInMeters,
                            arrivalTime: new Date(summary.arrivalTime).getTime(),
                        };
                    }),
                });
            }
            setMonitoredRoutes(routes);
        };

        unsubs.push(
            routing.events.on('monitor-start', ({ entryId }) => {
                activeIdsRef.current.add(entryId);
                refresh();
            }),
        );
        unsubs.push(
            routing.events.on('monitor-stop', ({ entryId }) => {
                activeIdsRef.current.delete(entryId);
                refresh();
            }),
        );
        unsubs.push(
            routing.events.on('monitor-tick', ({ entryId }) => {
                if (!activeIdsRef.current.has(entryId)) return;
                setRouteLastTickAt(Date.now());
                setRouteTickCount((n) => n + 1);
                refresh();
            }),
        );
        // Recalculations land via entries-change too — keep summaries fresh.
        unsubs.push(routing.events.on('entries-change', refresh));

        return () => {
            for (const unsub of unsubs) unsub();
            activeIdsRef.current = new Set();
            setMonitoredRoutes([]);
            setRouteLastTickAt(null);
            setRouteTickCount(0);
        };
    }, [agent]);

    // Monitors are per-entry; the panel's Stop is global, so stop every running one.
    const stopRouteMonitor = () => {
        if (!agent) return;
        for (const entry of agent.state.routing.entries) {
            if (agent.state.routing.isMonitored(entry.id)) {
                agent.state.routing.stopMonitoring(entry.id);
            }
        }
    };

    const routeMonitorLabel = monitoredRoutes[0]?.label ?? null;

    return { monitoredRoutes, routeMonitorLabel, routeLastTickAt, routeTickCount, stopRouteMonitor };
}
