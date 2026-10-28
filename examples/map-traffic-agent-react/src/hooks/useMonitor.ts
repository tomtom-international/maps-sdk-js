import { useEffect, useRef, useState } from 'react';
import type { AgentInstance } from './useAgentBootstrap';

/**
 * Surfaces the actively-monitored area for the chip in the top-left. The chip
 * is gated on `monitor-start`/`monitor-stop` lifecycle events, not on dataset
 * existence — so it only goes "running" once `setTrafficIncidentsMonitor`
 * has been called, and clears on stop or dataset teardown. Snapshot count and
 * last-analysis timestamp track the monitored dataset across its ticks.
 */
export function useMonitor(agent: AgentInstance | undefined) {
    const [monitoredDatasetId, setMonitoredDatasetId] = useState<string | null>(null);
    const [lastAnalysisAt, setLastAnalysisAt] = useState<number | null>(null);
    const [snapshotCount, setSnapshotCount] = useState(0);
    // Id of the dataset whose monitor is currently running. null when idle.
    const activeDatasetIdRef = useRef<string | null>(null);

    useEffect(() => {
        if (!agent) return;
        const slice = agent.state.trafficIncidents;
        const unsubs: Array<() => void> = [];

        const refreshFromActiveDataset = () => {
            const id = activeDatasetIdRef.current;
            if (!id) {
                setMonitoredDatasetId(null);
                setLastAnalysisAt(null);
                return;
            }
            const dataset = slice.datasets.find((e) => e.id === id);
            if (!dataset) {
                setMonitoredDatasetId(null);
                setLastAnalysisAt(null);
                return;
            }
            setMonitoredDatasetId(dataset.id);
            // Freshness = the dataset's latest snapshot moment, set on load and every
            // monitor tick. Analyses re-run per snapshot and are stamped with the same
            // moment, so this is the "last analysis" time — no registry reach-in needed.
            setLastAnalysisAt(dataset.timestamp);
        };

        unsubs.push(
            slice.events.on('monitor-start', ({ datasetId }) => {
                activeDatasetIdRef.current = datasetId;
                setSnapshotCount(0);
                refreshFromActiveDataset();
            }),
        );
        unsubs.push(
            slice.events.on('monitor-stop', ({ datasetId }) => {
                if (activeDatasetIdRef.current !== datasetId) return;
                activeDatasetIdRef.current = null;
                setMonitoredDatasetId(null);
                setLastAnalysisAt(null);
                setSnapshotCount(0);
            }),
        );
        unsubs.push(
            slice.events.on('monitor-tick', ({ datasetId }) => {
                if (datasetId !== activeDatasetIdRef.current) return;
                setSnapshotCount((n) => n + 1);
            }),
        );
        // Re-runs of analyses on each tick land via datasets-change — refresh
        // the freshness timestamp off the active dataset whenever they do.
        unsubs.push(slice.events.on('datasets-change', refreshFromActiveDataset));

        return () => {
            for (const unsub of unsubs) unsub();
            activeDatasetIdRef.current = null;
            setMonitoredDatasetId(null);
            setLastAnalysisAt(null);
            setSnapshotCount(0);
        };
    }, [agent]);

    return { monitoredDatasetId, lastAnalysisAt, snapshotCount };
}
