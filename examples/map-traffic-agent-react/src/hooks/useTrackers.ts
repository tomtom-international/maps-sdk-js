import { bboxFromGeoJSON } from '@tomtom-org/maps-sdk/core';
import type { Tracker, TrackerEvent } from '@tomtom-org/maps-sdk-plugin-agent-toolkit';
import { useEffect, useState } from 'react';
import type { AgentInstance } from './useAgentBootstrap';

const MAX_TOASTS = 4;
const TOAST_TTL_MS = 12_000;

export type TrackerToast = TrackerEvent & { seq: number };

/**
 * A watched area = a traffic-incidents entry one or more trackers read, with its mini-KPIs. The tracker
 * panel groups by area, so an operator sees "what am I watching, where".
 */
export type WatchedArea = {
    entryId: string;
    label: string;
    incidents: number;
    delaySeconds: number;
    majorPlus: number;
    trackers: Tracker[];
};

type Grouping = { areas: WatchedArea[]; ungrouped: Tracker[] };

// Group trackers by the traffic-incidents entry they watch (their spatial "area"). A tracker's inputs are
// the analysis `affectedEntryIds`; the incidents entry among them is the area anchor. Trackers with no
// incidents entry (e.g. a pure places/routes rule) fall into `ungrouped`. KPIs come from the entry's live
// incident data — traffic-specific, lives here in the example, not in the generic tracker layer.
function groupByArea(agent: AgentInstance, trackers: readonly Tracker[]): Grouping {
    const incidentEntryIds = new Set(agent.state.trafficIncidents.entries.map((e) => e.id));
    const byArea = new Map<string, Tracker[]>();
    const ungrouped: Tracker[] = [];

    for (const tracker of trackers) {
        const inputs = agent.state.analyses.get(tracker.analysisId)?.affectedEntryIds ?? [];
        const areaId = inputs.find((id) => incidentEntryIds.has(id));
        if (areaId === undefined) {
            ungrouped.push(tracker);
            continue;
        }
        const group = byArea.get(areaId);
        if (group) group.push(tracker);
        else byArea.set(areaId, [tracker]);
    }

    const areas: WatchedArea[] = [];
    for (const [entryId, group] of byArea) {
        const entry = agent.state.trafficIncidents.entries.find((e) => e.id === entryId);
        const data = entry?.data ?? [];
        let delaySeconds = 0;
        let majorPlus = 0;
        for (const f of data) {
            delaySeconds += f.properties.delayInSeconds ?? 0;
            const mag = f.properties.magnitudeOfDelay;
            if (mag === 'major' || mag === 'indefinite') majorPlus += 1;
        }
        areas.push({
            entryId,
            label: entry?.label ?? entryId,
            incidents: data.length,
            delaySeconds,
            majorPlus,
            trackers: group,
        });
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
        if (!agent) return;
        const analysisId = agent.state.trackers.unregister(trackerId);
        if (analysisId) agent.state.analyses.remove(analysisId);
    };

    // Frame a watched area on the map — the bbox of its current incidents (click an area card to focus).
    const focusArea = (entryId: string) => {
        if (!agent) return;
        const entry = agent.state.trafficIncidents.entries.find((e) => e.id === entryId);
        if (!entry || entry.data.length === 0) return;
        const bbox = bboxFromGeoJSON({ type: 'FeatureCollection', features: entry.data as never });
        agent.state.baseMap.mapLibreMap.fitBounds(bbox as [number, number, number, number], {
            padding: 80,
            duration: 600,
        });
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
