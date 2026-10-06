import { bboxFromGeoJSON, type Routes } from '@tomtom-org/maps-sdk/core';
import type { LngLatBoundsLike } from 'maplibre-gl';
import { useEffect, useRef, useState } from 'react';
import { frameBounds } from '../utils/frameBounds';
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

/** A monitored route entry surfaced for the Monitoring panel's route cards. */
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
                        const { index, summary, sections } = feature.properties;
                        // `summary.trafficDelayInSeconds` is ~0 here: the corridor is routed with
                        // `traffic: "historical"`, which keeps the path stable but folds no live jams into
                        // the summary. The live delay is carried per-incident in the on-route traffic
                        // sections instead — the same sections drawn on the map — so sum those.
                        const trafficDelayInSeconds = (sections?.traffic ?? []).reduce(
                            (sum, section) => sum + (section.delayInSeconds ?? 0),
                            0,
                        );
                        return {
                            index,
                            travelTimeInSeconds: summary.travelTimeInSeconds,
                            trafficDelayInSeconds,
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

    // Frame a monitored corridor on the map — fit to the route geometry's bbox. Click a route card's
    // locate button to focus.
    const frameRoute = (entryId: string) => {
        if (!agent) return;
        const entry = agent.state.routing.entries.find((e) => e.id === entryId);
        if (!entry) return;
        const bbox = bboxFromGeoJSON(entry.data);
        if (!bbox) return;
        frameBounds(agent.state.baseMap.mapLibreMap, bbox as LngLatBoundsLike);
    };

    // Stop one corridor's monitor — the Monitoring panel surfaces a route per card, so Stop is per-route.
    const stopRoute = (entryId: string) => {
        if (!agent) return;
        if (agent.state.routing.isMonitored(entryId)) agent.state.routing.stopMonitoring(entryId);
    };

    // Stop every running monitor at once (kept for callers that halt all corridors).
    const stopRouteMonitor = () => {
        if (!agent) return;
        for (const entry of agent.state.routing.entries) {
            if (agent.state.routing.isMonitored(entry.id)) {
                agent.state.routing.stopMonitoring(entry.id);
            }
        }
    };

    const routeMonitorLabel = monitoredRoutes[0]?.label ?? null;

    return {
        monitoredRoutes,
        routeMonitorLabel,
        routeLastTickAt,
        routeTickCount,
        frameRoute,
        stopRoute,
        stopRouteMonitor,
    };
}
