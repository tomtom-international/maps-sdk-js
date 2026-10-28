import { useCallback, useEffect, useRef, useState } from 'react';
import type { IncidentsSnapshot } from './types';
import type { AgentInstance } from './useAgentBootstrap';

/**
 * The example surfaces a single incident snapshot at a time on the heatmap + summary/triage panels.
 * By default that snapshot follows the latest dataset (a fresh `getTrafficIncidents` fetch drives the
 * panels), but the active dataset can be pinned via {@link useIncidents}'s `focusDataset` — clicking a
 * watched-area in the Event tracker points the summary at that area. A new fetch (an unseen dataset id)
 * re-takes focus; monitor ticks (same id, replaced data) keep the pinned area and update it live.
 */
export function useIncidents(agent: AgentInstance | undefined) {
    const [incidents, setIncidents] = useState<IncidentsSnapshot>({ label: '', items: [] });
    // Id of the dataset the panels currently display (focused or latest). Lets callers correlate the
    // summary with its monitor (the live-status dot only belongs to it when it's the monitored dataset).
    const [datasetId, setDatasetId] = useState<string | null>(null);
    // Dataset the panels point at. null → follow the latest dataset. Held in a ref so `focusDataset` and the
    // datasets-change listener share one source without re-subscribing.
    const selectedIdRef = useRef<string | null>(null);
    const focusDatasetRef = useRef<(datasetId: string) => void>(() => {});

    useEffect(() => {
        if (!agent) return;
        const known = new Set(agent.state.trafficIncidents.datasets.map((e) => e.id));

        const resolve = () => {
            const datasets = agent.state.trafficIncidents.datasets;
            // A brand-new dataset (id not seen before) takes focus — a fresh fetch should drive the panels.
            for (const e of datasets) {
                if (!known.has(e.id)) {
                    known.add(e.id);
                    selectedIdRef.current = e.id;
                }
            }
            const liveIds = new Set(datasets.map((e) => e.id));
            for (const id of known) if (!liveIds.has(id)) known.delete(id);

            // Pinned dataset if it still exists, else fall back to the latest.
            const dataset =
                (selectedIdRef.current && datasets.find((e) => e.id === selectedIdRef.current)) ||
                datasets[datasets.length - 1];
            setIncidents(dataset ? { label: dataset.label, items: dataset.data } : { label: '', items: [] });
            setDatasetId(dataset?.id ?? null);
        };

        focusDatasetRef.current = (datasetId: string) => {
            selectedIdRef.current = datasetId;
            resolve();
        };
        resolve();

        const unsub = agent.state.trafficIncidents.events.on('datasets-change', resolve);
        return () => {
            unsub();
            selectedIdRef.current = null;
            // Drop the closure over this (now torn-down) agent so a stray focusDataset() can't
            // setIncidents on the superseded effect.
            focusDatasetRef.current = () => {};
            setIncidents({ label: '', items: [] });
            setDatasetId(null);
        };
    }, [agent]);

    // Point the panels at a specific dataset (e.g. the Event tracker's area button).
    const focusDataset = useCallback((id: string) => focusDatasetRef.current(id), []);

    return { incidents, datasetId, focusDataset };
}
