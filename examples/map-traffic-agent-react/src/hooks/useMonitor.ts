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
                setLastAnalysisAt(null);
                return;
            }
            const entry = slice.entries.find((e) => e.id === id);
            if (!entry) {
                setMonitoredLabel(null);
                setLastAnalysisAt(null);
                return;
            }
            setMonitoredLabel(entry.label ?? null);
            // Freshness signal — use the analysis driving the cluster pins
            // (or the first json one). Cluster parsing itself lives in
            // useClusters.
            const jsonAnalyses = entry._analyses?.results.filter((a) => a.outputFormat === 'json') ?? [];
            const analysis = jsonAnalyses.find((a) => a.name === 'clusters') ?? jsonAnalyses[0];
            setLastAnalysisAt(analysis?.timestamp ?? null);
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
            setLastAnalysisAt(null);
            setSnapshotCount(0);
        };
    }, [agent]);

    // Monitors are per-entry. The UI button is global, so apply stop to every
    // entry that has one — typically just the single demo monitor.
    const stopMonitor = () => {
        if (!agent) return;
        for (const entry of agent.state.trafficIncidents.entries) {
            if (agent.state.trafficIncidents.isMonitored(entry.id)) {
                agent.state.trafficIncidents.stopMonitoring(entry.id);
            }
        }
    };

    return { monitoredLabel, lastAnalysisAt, snapshotCount, stopMonitor };
}
