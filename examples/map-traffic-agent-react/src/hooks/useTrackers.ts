import { isBBoxWithArea } from '@tomtom-org/maps-sdk/core';
import type { Tracker, TrackerEvent } from '@tomtom-org/maps-sdk-plugin-agent-toolkit';
import { useEffect, useState } from 'react';
import { frameBounds } from '../utils/frameBounds';
import type { AgentInstance } from './useAgentBootstrap';

const MAX_TOASTS = 4;
const TOAST_TTL_MS = 12_000;

export type TrackerToast = TrackerEvent & { seq: number };

/**
 * A watched area = a shown traffic-incidents entry, with the trackers (if any) that read it. The tracker
 * panel groups by area, so an operator sees "what am I watching, where".
 */
export type WatchedArea = {
    entryId: string;
    label: string;
    trackers: Tracker[];
};

type Grouping = { areas: WatchedArea[]; ungrouped: Tracker[] };

// Group trackers by the traffic-incidents entry they watch (their spatial "area"). Every SHOWN incident
// entry becomes a watched area, even with no trackers — loading an area (getTrafficIncidents) is itself
// "watching" it. A tracker's inputs are its analysis `affectedEntryIds`; one bound to exactly one incident
// entry nests under that area. Trackers spanning several areas, or none (e.g. a pure places/routes rule),
// fall into `ungrouped` (rendered as the "Other" group).
function groupByArea(agent: AgentInstance, trackers: readonly Tracker[]): Grouping {
    const entries = agent.state.trafficIncidents.entries;
    const incidentEntryIds = new Set(entries.map((e) => e.id));
    const byArea = new Map<string, Tracker[]>();
    // Seed an (initially empty) group per shown area so areas with no trackers still surface.
    for (const id of agent.state.trafficIncidents.shownEntryIds) byArea.set(id, []);
    const ungrouped: Tracker[] = [];

    for (const tracker of trackers) {
        // Trackers carry their own input ids now (decoupled from the Analyses registry).
        const areaIds = tracker.affectedEntryIds.filter((id) => incidentEntryIds.has(id));
        // Single-area → nest under that area; multi-area or area-less → "Other".
        if (areaIds.length !== 1) {
            ungrouped.push(tracker);
            continue;
        }
        const group = byArea.get(areaIds[0]);
        if (group) group.push(tracker);
        else byArea.set(areaIds[0], [tracker]);
    }

    const areas: WatchedArea[] = [];
    for (const [entryId, group] of byArea) {
        const entry = entries.find((e) => e.id === entryId);
        areas.push({ entryId, label: entry?.label ?? entryId, trackers: group });
    }
    return { areas, ungrouped };
}

/**
 * Surface tracker state for the UI: trackers grouped by watched area (the watching list), the durable
 * event log (feed), and a short-lived toast stack for freshly-fired alerts.
 *
 * Trackers are a thin reducer over the analyses registry — `trackers-change` fires on create/clear/enable
 * AND whenever a rule crosses an edge. The area grouping + KPIs also depend on live incident data, so we
 * additionally re-derive on the incidents slice's `entries-change`.
 */
export function useTrackers(agent: AgentInstance | undefined) {
    const [trackers, setTrackers] = useState<readonly Tracker[]>([]);
    const [areas, setAreas] = useState<readonly WatchedArea[]>([]);
    const [ungrouped, setUngrouped] = useState<readonly Tracker[]>([]);
    const [events, setEvents] = useState<readonly TrackerEvent[]>([]);
    const [toasts, setToasts] = useState<readonly TrackerToast[]>([]);
    // Rows logged after this moment show the unread dot; advanced when the alerts tab is viewed.
    const [lastSeenAt, setLastSeenAt] = useState(() => Date.now());

    useEffect(() => {
        if (!agent) return;
        let seq = 0;
        // Pending auto-dismiss timers, cleared on teardown so a stale timer from a previous effect run
        // can't dismiss a fresh toast whose `seq` happens to collide (seq restarts at 0 each run).
        const dismissTimers = new Set<ReturnType<typeof setTimeout>>();

        const sync = () => {
            const live = agent.state.trackers.trackers;
            setTrackers(live);
            const { areas: a, ungrouped: u } = groupByArea(agent, live);
            setAreas(a);
            setUngrouped(u);
            setEvents([...agent.state.trackers.log()].reverse()); // newest first
        };
        sync();

        const unsubChange = agent.state.trackers.events.on('trackers-change', sync);
        const unsubEntries = agent.state.trafficIncidents.events.on('entries-change', sync);
        // Watched areas are seeded from the SHOWN entries, and an entry is shown right AFTER it's added
        // (a separate `shown-change` after `entries-change`), so the list must re-derive on show/hide too.
        const unsubShown = agent.state.trafficIncidents.events.on('shown-change', sync);
        const unsubEvent = agent.state.trackers.events.on('tracker-event', (event) => {
            sync();
            if (event.type !== 'alert') return; // only alerts toast; events sit quietly in the feed
            const toast: TrackerToast = { ...event, seq: seq++ };
            setToasts((prev) => [toast, ...prev].slice(0, MAX_TOASTS));
            const timer = setTimeout(() => {
                dismissTimers.delete(timer);
                setToasts((prev) => prev.filter((t) => t.seq !== toast.seq));
            }, TOAST_TTL_MS);
            dismissTimers.add(timer);
        });

        return () => {
            unsubChange();
            unsubEntries();
            unsubShown();
            unsubEvent();
            dismissTimers.forEach(clearTimeout);
            setTrackers([]);
            setAreas([]);
            setUngrouped([]);
            setEvents([]);
            setToasts([]);
        };
    }, [agent]);

    const dismissToast = (seq: number) => setToasts((prev) => prev.filter((t) => t.seq !== seq));
    const markSeen = () => setLastSeenAt(Date.now());

    const setEnabled = (trackerId: string, enabled: boolean) => agent?.state.trackers.setEnabled(trackerId, enabled);

    const clearTracker = (trackerId: string) => {
        // unregister tears down the tracker's job; there is no separate analysis to remove anymore.
        agent?.state.trackers.unregister(trackerId);
    };

    // Frame a watched area on the map — its fetched bbox (same anchor as the highlight box), so an area
    // with zero incidents still frames. Click an area card to focus.
    const focusArea = (entryId: string) => {
        if (!agent) return;
        const bbox = agent.state.trafficIncidents.entries.find((e) => e.id === entryId)?.params.bbox;
        if (!bbox || !isBBoxWithArea(bbox)) return;
        frameBounds(agent.state.baseMap.mapLibreMap, bbox as [number, number, number, number]);
    };

    return {
        trackers,
        areas,
        ungrouped,
        events,
        toasts,
        dismissToast,
        lastSeenAt,
        markSeen,
        setEnabled,
        clearTracker,
        focusArea,
    };
}
