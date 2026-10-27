import type { Routes } from '@tomtom-org/maps-sdk/core';
import type { AgentInstance } from '../hooks/useAgentBootstrap';

type RouteFeature = Routes['features'][number];
type RoutingState = Pick<AgentInstance['state']['routing'], 'entries' | 'isMonitored'>;

/** One alternative of a monitored corridor, with its live-traffic summary. */
export type RouteAlternative = {
    index: number;
    travelTimeInSeconds: number;
    trafficDelayInSeconds: number;
    lengthInMeters: number;
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
 * The routing entries whose monitor is running, each alternative with its live travel time and traffic
 * delay. Asks the slice which monitors run rather than tracking `monitor-start` / `monitor-stop`, since
 * `reset()` stops monitors without emitting `monitor-stop` and entry ids restart at `routes-0` after it.
 */
export const monitoredRoutes = (routing: RoutingState): MonitoredRoute[] =>
    routing.entries
        .filter((entry) => routing.isMonitored(entry.id))
        .map((entry) => ({
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
                    arrivalTime: new Date(summary.arrivalTime).getTime(),
                };
            }),
        }));
