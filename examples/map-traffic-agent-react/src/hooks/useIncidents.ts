import { useCallback, useEffect, useRef, useState } from 'react';
import type { IncidentsSnapshot } from './types';
import type { AgentInstance } from './useAgentBootstrap';

/**
 * The example surfaces a single incident snapshot at a time on the heatmap + summary/triage panels.
 * By default that snapshot follows the latest entry (a fresh `getTrafficIncidents` fetch drives the
 * panels), but the active entry can be pinned via {@link useIncidents}'s `focusEntry` — clicking a
 * watched-area in the Event tracker points the summary at that area. A new fetch (an unseen entry id)
 * re-takes focus; monitor ticks (same id, replaced data) keep the pinned area and update it live.
 */
export function useIncidents(agent: AgentInstance | undefined) {
    const [incidents, setIncidents] = useState<IncidentsSnapshot>({ label: '', items: [] });
    // Id of the entry the panels currently display (focused or latest). Lets callers correlate the
    // summary with its monitor (the live-status dot only belongs to it when it's the monitored entry).
    const [entryId, setEntryId] = useState<string | null>(null);
    // Entry the panels point at. null → follow the latest entry. Held in a ref so `focusEntry` and the
    // entries-change listener share one source without re-subscribing.
    const selectedIdRef = useRef<string | null>(null);
    const focusEntryRef = useRef<(entryId: string) => void>(() => {});

    useEffect(() => {
        if (!agent) return;
        const known = new Set(agent.state.trafficIncidents.entries.map((e) => e.id));

        const resolve = () => {
            const entries = agent.state.trafficIncidents.entries;
            // A brand-new entry (id not seen before) takes focus — a fresh fetch should drive the panels.
            for (const e of entries) {
                if (!known.has(e.id)) {
                    known.add(e.id);
                    selectedIdRef.current = e.id;
                }
            }
            const liveIds = new Set(entries.map((e) => e.id));
            for (const id of known) if (!liveIds.has(id)) known.delete(id);

            // Pinned entry if it still exists, else fall back to the latest.
            const entry =
                (selectedIdRef.current && entries.find((e) => e.id === selectedIdRef.current)) ||
                entries[entries.length - 1];
            setIncidents(entry ? { label: entry.label, items: entry.data } : { label: '', items: [] });
            setEntryId(entry?.id ?? null);
        };

        focusEntryRef.current = (entryId: string) => {
            selectedIdRef.current = entryId;
            resolve();
        };
        resolve();

        const unsub = agent.state.trafficIncidents.events.on('entries-change', resolve);
        return () => {
            unsub();
            selectedIdRef.current = null;
            // Drop the closure over this (now torn-down) agent so a stray focusEntry() can't
            // setIncidents on the superseded effect.
            focusEntryRef.current = () => {};
            setIncidents({ label: '', items: [] });
            setEntryId(null);
        };
    }, [agent]);

    // Point the panels at a specific entry (e.g. the Event tracker's area button).
    const focusEntry = useCallback((id: string) => focusEntryRef.current(id), []);

    return { incidents, entryId, focusEntry };
}
