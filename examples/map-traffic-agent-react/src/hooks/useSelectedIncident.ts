import type { TrafficIncident } from '@tomtom-org/maps-sdk/core';
import type { UserEventHandler } from '@tomtom-org/maps-sdk/map';
import { useEffect, useState } from 'react';
import type { SelectedIncident } from './types';
import type { AgentInstance } from './useAgentBootstrap';

/**
 * Tracks the incident the user has clicked on (drives IncidentDetailsPanel).
 *
 * Wires a click handler onto each entry's TrafficIncidentOverlayModule as it transitions
 * to shown, and tears it down when the entry is hidden or removed. Also re-binds to the
 * freshest version of the same feature whenever entries change — without this the panel
 * would show stale geometry/properties as the toolkit re-polls.
 */
export function useSelectedIncident(agent: AgentInstance | undefined) {
    const [selectedIncident, setSelectedIncident] = useState<SelectedIncident>(null);

    useEffect(() => {
        if (!agent) return;
        const sliceUnsubs: Array<() => void> = [];
        const moduleUnsubs = new Map<string, () => void>();

        const wireEntry = async (entryId: string) => {
            if (moduleUnsubs.has(entryId)) return;
            const overlay = await agent.state.trafficIncidents.getEntryModule(entryId);
            const onClick: UserEventHandler<TrafficIncident> = (incident, _lngLat, all) => {
                setSelectedIncident({ incident, overlapCount: all.length });
            };
            const unsub = overlay.events.on('click', onClick);
            moduleUnsubs.set(entryId, unsub);
        };

        const unwireEntry = (entryId: string) => {
            moduleUnsubs.get(entryId)?.();
            moduleUnsubs.delete(entryId);
        };

        sliceUnsubs.push(
            agent.state.trafficIncidents.events.on('shown-change', (shown) => {
                for (const id of shown) void wireEntry(id);
                for (const id of [...moduleUnsubs.keys()]) {
                    if (!shown.has(id)) unwireEntry(id);
                }
                // Drop the panel when the entry holding the selected incident is no longer shown.
                setSelectedIncident((current) => {
                    if (!current) return null;
                    const owning = agent.state.trafficIncidents.entries.find((e) =>
                        e.data.some((f) => f.properties.id === current.incident.properties.id),
                    );
                    return owning && shown.has(owning.id) ? current : null;
                });
            }),
        );

        // Already-shown entries at hook init.
        for (const id of agent.state.trafficIncidents.shownEntryIds) void wireEntry(id);

        sliceUnsubs.push(
            agent.state.trafficIncidents.events.on('entries-change', (entries) => {
                const latest = entries.length > 0 ? entries[entries.length - 1] : undefined;
                setSelectedIncident((current) => {
                    if (!current) return null;
                    if (!latest) return null;
                    // If the API id has rolled (split/merge), the underlying
                    // handle no longer exists — close the panel.
                    const refreshed = latest.data.find((f) => f.properties.id === current.incident.properties.id);
                    return refreshed ? { incident: refreshed, overlapCount: current.overlapCount } : null;
                });
            }),
        );

        return () => {
            for (const unsub of sliceUnsubs) unsub();
            for (const unsub of moduleUnsubs.values()) unsub();
            moduleUnsubs.clear();
            setSelectedIncident(null);
        };
    }, [agent]);

    const selectIncident = (id: string) => {
        if (!agent) return;
        const entry = agent.state.trafficIncidents.findEntryWithIncident(id);
        const incident = entry?.data.find((f) => f.properties.id === id);
        if (!incident) return;
        // Panel-driven selection has no map-stack context, so overlapCount is 1
        // (the panel only renders the overlap row when count > 1).
        setSelectedIncident({ incident, overlapCount: 1 });
    };

    return {
        selectedIncident,
        selectIncident,
        clearSelectedIncident: () => setSelectedIncident(null),
    };
}
