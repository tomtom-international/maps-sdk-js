import type { TrafficIncident } from '@tomtom-org/maps-sdk/core';
import type { UserEventHandler } from '@tomtom-org/maps-sdk/map';
import { useEffect, useState } from 'react';
import type { SelectedIncident } from './types';
import type { AgentInstance } from './useAgentBootstrap';

/**
 * Tracks the incident the user has clicked on (drives IncidentDetailsPanel).
 *
 * Wires a click handler onto each dataset's TrafficIncidentDetailsModule as it transitions
 * to shown, and tears it down when the dataset is hidden or removed. Also re-binds to the
 * freshest version of the same feature whenever datasets change — without this the panel
 * would show stale geometry/properties as the toolkit re-polls.
 */
export function useSelectedIncident(agent: AgentInstance | undefined) {
    const [selectedIncident, setSelectedIncident] = useState<SelectedIncident>(null);

    useEffect(() => {
        if (!agent) return;
        const sliceUnsubs: Array<() => void> = [];
        const moduleUnsubs = new Map<string, () => void>();

        const wireDataset = async (datasetId: string) => {
            if (moduleUnsubs.has(datasetId)) return;
            const incidentDetailsModule = await agent.state.trafficIncidents.getDatasetModule(datasetId);
            const onClick: UserEventHandler<TrafficIncident> = (incident, _lngLat, all) => {
                const stack = all.length > 0 ? all : [incident];
                const index = Math.max(
                    0,
                    stack.findIndex((f) => f.properties.id === incident.properties.id),
                );
                setSelectedIncident({ incidents: stack, index });
            };
            const unsub = incidentDetailsModule.events.on('click', onClick);
            moduleUnsubs.set(datasetId, unsub);
        };

        const unwireDataset = (datasetId: string) => {
            moduleUnsubs.get(datasetId)?.();
            moduleUnsubs.delete(datasetId);
        };

        sliceUnsubs.push(
            agent.state.trafficIncidents.events.on('shown-change', (shown) => {
                for (const id of shown) void wireDataset(id);
                for (const id of [...moduleUnsubs.keys()]) {
                    if (!shown.has(id)) unwireDataset(id);
                }
                // Drop the panel when the dataset holding the shown incident is no longer shown.
                setSelectedIncident((current) => {
                    if (!current) return null;
                    const shownId = current.incidents[current.index]?.properties.id;
                    const owning = agent.state.trafficIncidents.datasets.find((e) =>
                        e.data.some((f) => f.properties.id === shownId),
                    );
                    return owning && shown.has(owning.id) ? current : null;
                });
            }),
        );

        // Already-shown datasets at hook init.
        for (const id of agent.state.trafficIncidents.shownDatasetIds) void wireDataset(id);

        sliceUnsubs.push(
            agent.state.trafficIncidents.events.on('datasets-change', ({ datasets }) => {
                const allData = datasets.flatMap((e) => e.data);
                setSelectedIncident((current) => {
                    if (!current) return null;
                    // Re-bind each stacked incident to its freshest version, dropping any whose API id
                    // rolled (split/merge); close if none survive, else keep the shown one in view.
                    const shownId = current.incidents[current.index]?.properties.id;
                    const refreshed = current.incidents
                        .map((inc) => allData.find((f) => f.properties.id === inc.properties.id))
                        .filter((f): f is TrafficIncident => f !== undefined);
                    if (refreshed.length === 0) return null;
                    const index = Math.max(
                        0,
                        refreshed.findIndex((f) => f.properties.id === shownId),
                    );
                    return { incidents: refreshed, index };
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
        const dataset = agent.state.trafficIncidents.findDatasetWithIncident(id);
        const incident = dataset?.data.find((f) => f.properties.id === id);
        if (!incident) return;
        // Panel-driven selection has no map-stack context, so it's a single-item stack.
        setSelectedIncident({ incidents: [incident], index: 0 });
    };

    // Page through the overlap stack (footer prev/next), clamped to its bounds.
    const pageIncident = (delta: number) =>
        setSelectedIncident((current) => {
            if (!current) return current;
            const index = current.index + delta;
            if (index < 0 || index >= current.incidents.length) return current;
            return { ...current, index };
        });

    return {
        selectedIncident,
        selectIncident,
        pageIncident,
        clearSelectedIncident: () => setSelectedIncident(null),
    };
}
