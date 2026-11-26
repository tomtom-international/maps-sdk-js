import { isBBoxWithArea } from '@tomtom-org/maps-sdk/core';
import type { EventRule, RuleEvent } from '@tomtom-org/maps-sdk-plugin-agent-toolkit';
import { useEffect, useState } from 'react';
import { frameBounds } from '../utils/frameBounds';
import type { AgentInstance } from './useAgentBootstrap';

const MAX_TOASTS = 4;
const TOAST_TTL_MS = 12_000;

export type RuleEventToast = RuleEvent & { seq: number };

/**
 * A watched area = a shown traffic-incidents dataset, with the event rules (if any) that read it. The event rule
 * panel groups by area, so an operator sees "what am I watching, where".
 */
export type WatchedArea = {
    datasetId: string;
    label: string;
    eventRules: EventRule[];
};

type Grouping = { areas: WatchedArea[]; ungrouped: EventRule[] };

// Group event rules by the traffic-incidents dataset they watch (their spatial "area"). Every SHOWN incident
// dataset becomes a watched area, even with no event rules — loading an area (getTrafficIncidents) is itself
// "watching" it. An event rule's inputs are its `affectedDatasetIds`; one bound to exactly one incident
// dataset nests under that area. Event rules spanning several areas, or none (e.g. a pure places/routes rule),
// fall into `ungrouped` (rendered as the "Other" group).
function groupByArea(agent: AgentInstance, eventRules: readonly EventRule[]): Grouping {
    const datasets = agent.state.trafficIncidents.datasets;
    const incidentDatasetIds = new Set(datasets.map((e) => e.id));
    const byArea = new Map<string, EventRule[]>();
    // Seed an (initially empty) group per shown area so areas with no event rules still surface.
    for (const id of agent.state.trafficIncidents.shownDatasetIds) byArea.set(id, []);
    const ungrouped: EventRule[] = [];

    for (const eventRule of eventRules) {
        // Event rules carry their own input ids, apart from the Analyses registry.
        const areaIds = eventRule.affectedDatasetIds.filter((id) => incidentDatasetIds.has(id));
        // Single-area → nest under that area; multi-area or area-less → "Other".
        if (areaIds.length !== 1) {
            ungrouped.push(eventRule);
            continue;
        }
        const group = byArea.get(areaIds[0]);
        if (group) group.push(eventRule);
        else byArea.set(areaIds[0], [eventRule]);
    }

    const areas: WatchedArea[] = [];
    for (const [datasetId, group] of byArea) {
        const dataset = agent.state.trafficIncidents.findById(datasetId);
        areas.push({ datasetId, label: dataset?.label ?? datasetId, eventRules: group });
    }
    return { areas, ungrouped };
}

/**
 * Surface event rule state for the UI: event rules grouped by watched area (the watching list), the durable
 * event log (feed), and a short-lived toast stack for freshly-fired alerts.
 *
 * Event rules keep their own store — `event-rules-change` fires on create/clear/enable
 * AND whenever a rule crosses an edge. The area grouping + KPIs also depend on live incident data, so we
 * additionally re-derive on the incidents slice's `datasets-change`.
 */
export function useEventRules(agent: AgentInstance | undefined) {
    const [eventRules, setEventRules] = useState<readonly EventRule[]>([]);
    const [areas, setAreas] = useState<readonly WatchedArea[]>([]);
    const [ungrouped, setUngrouped] = useState<readonly EventRule[]>([]);
    const [events, setEvents] = useState<readonly RuleEvent[]>([]);
    const [toasts, setToasts] = useState<readonly RuleEventToast[]>([]);
    // Rows logged after this moment show the unread dot; advanced when the alerts tab is viewed.
    const [lastSeenAt, setLastSeenAt] = useState(() => Date.now());

    useEffect(() => {
        if (!agent) return;
        let seq = 0;
        // Pending auto-dismiss timers, cleared on teardown so a stale timer from a previous effect run
        // can't dismiss a fresh toast whose `seq` happens to collide (seq restarts at 0 each run).
        const dismissTimers = new Set<ReturnType<typeof setTimeout>>();

        const sync = () => {
            const live = agent.state.eventRules.rules;
            setEventRules(live);
            const { areas: a, ungrouped: u } = groupByArea(agent, live);
            setAreas(a);
            setUngrouped(u);
            setEvents([...agent.state.eventRules.log()].reverse()); // newest first
        };
        sync();

        const unsubChange = agent.state.eventRules.events.on('event-rules-change', sync);
        const unsubDatasets = agent.state.trafficIncidents.events.on('datasets-change', sync);
        // Watched areas are seeded from the SHOWN datasets, and a dataset is shown right AFTER it's added
        // (a separate `shown-change` after `datasets-change`), so the list must re-derive on show/hide too.
        const unsubShown = agent.state.trafficIncidents.events.on('shown-change', sync);
        const unsubEvent = agent.state.eventRules.events.on('rule-event', (event) => {
            sync();
            if (event.type !== 'alert') return; // only alerts toast; events sit quietly in the feed
            const toast: RuleEventToast = { ...event, seq: seq++ };
            setToasts((prev) => [toast, ...prev].slice(0, MAX_TOASTS));
            const timer = setTimeout(() => {
                dismissTimers.delete(timer);
                setToasts((prev) => prev.filter((t) => t.seq !== toast.seq));
            }, TOAST_TTL_MS);
            dismissTimers.add(timer);
        });

        return () => {
            unsubChange();
            unsubDatasets();
            unsubShown();
            unsubEvent();
            dismissTimers.forEach(clearTimeout);
            setEventRules([]);
            setAreas([]);
            setUngrouped([]);
            setEvents([]);
            setToasts([]);
        };
    }, [agent]);

    const dismissToast = (seq: number) => setToasts((prev) => prev.filter((t) => t.seq !== seq));
    const markSeen = () => setLastSeenAt(Date.now());

    const setEnabled = (ruleId: string, enabled: boolean) => agent?.state.eventRules.setEnabled(ruleId, enabled);

    const clearEventRule = (ruleId: string) => {
        // unregister tears down the event rule's job; there is no separate analysis to remove.
        agent?.state.eventRules.unregister(ruleId);
    };

    // Frame a watched area on the map — its fetched bbox (same anchor as the highlight box), so an area
    // with zero incidents still frames. Click an area card to focus.
    const focusArea = (datasetId: string) => {
        if (!agent) return;
        const bbox = agent.state.trafficIncidents.findById(datasetId)?.producedFrom.bbox;
        if (!bbox || !isBBoxWithArea(bbox)) return;
        frameBounds(agent.state.baseMap.mapLibreMap, bbox);
    };

    return {
        eventRules,
        areas,
        ungrouped,
        events,
        toasts,
        dismissToast,
        lastSeenAt,
        markSeen,
        setEnabled,
        clearEventRule,
        focusArea,
    };
}
