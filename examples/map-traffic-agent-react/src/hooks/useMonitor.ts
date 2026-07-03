import { useEffect, useRef, useState } from 'react';
import type { AgentInstance } from './useAgentBootstrap';

/**
 * Surfaces the actively-monitored area for the chip in the top-left. The chip
 * is gated on `monitor-start`/`monitor-stop` lifecycle events, not on entry
 * existence — so it only goes "running" once `startTrafficIncidentsMonitor`
 * has been called, and clears on stop or entry teardown. Snapshot count and
 * last-analysis timestamp track the monitored entry across its ticks.
 */
export function useMonitor(agent: AgentInstance | undefined) {
    const [monitoredLabel, setMonitoredLabel] = useState<string | null>(null);
    const [monitoredEntryId, setMonitoredEntryId] = useState<string | null>(null);
    const [lastAnalysisAt, setLastAnalysisAt] = useState<number | null>(null);
    const [snapshotCount, setSnapshotCount] = useState(0);
    // Id of the entry whose monitor is currently running. null when idle.
    const activeEntryIdRef = useRef<string | null>(null);

    useEffect(() => {
        if (!agent) return;
        const slice = agent.state.trafficIncidents;
        const unsubs: Array<() => void> = [];

        const refreshFromActiveEntry = () => {
            const id = activeEntryIdRef.current;
            if (!id) {
                setMonitoredLabel(null);
                setMonitoredEntryId(null);
                setLastAnalysisAt(null);
                return;
            }
            const entry = slice.entries.find((e) => e.id === id);
            if (!entry) {
                setMonitoredLabel(null);
                setMonitoredEntryId(null);
                setLastAnalysisAt(null);
                return;
            }
            setMonitoredLabel(entry.label ?? null);
            setMonitoredEntryId(entry.id);
            // Freshness = the entry's latest snapshot moment, set on load and every
            // monitor tick. Analyses re-run per snapshot and are stamped with the same
            // moment, so this is the "last analysis" time — no registry reach-in needed.
            setLastAnalysisAt(entry.timestamp);
        };

        unsubs.push(
            slice.events.on('monitor-start', ({ entryId }) => {
                activeEntryIdRef.current = entryId;
                setSnapshotCount(0);
                refreshFromActiveEntry();
            }),
        );
        unsubs.push(
            slice.events.on('monitor-stop', ({ entryId }) => {
                if (activeEntryIdRef.current !== entryId) return;
                activeEntryIdRef.current = null;
                setMonitoredLabel(null);
                setMonitoredEntryId(null);
                setLastAnalysisAt(null);
                setSnapshotCount(0);
            }),
        );
        unsubs.push(
            slice.events.on('monitor-tick', ({ entryId }) => {
                if (entryId !== activeEntryIdRef.current) return;
                setSnapshotCount((n) => n + 1);
            }),
        );
        // Re-runs of analyses on each tick land via entries-change — refresh
        // the freshness timestamp off the active entry whenever they do.
        unsubs.push(slice.events.on('entries-change', refreshFromActiveEntry));

        return () => {
            for (const unsub of unsubs) unsub();
            activeEntryIdRef.current = null;
            setMonitoredLabel(null);
            setMonitoredEntryId(null);
            setLastAnalysisAt(null);
            setSnapshotCount(0);
        };
    }, [agent]);

    return { monitoredLabel, monitoredEntryId, lastAnalysisAt, snapshotCount };
}
