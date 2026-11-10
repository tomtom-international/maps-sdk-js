import { bboxFromGeoJSON } from '@tomtom-org/maps-sdk/core';
import { useEffect, useState } from 'react';
import type { Cluster } from '../agent/types';
import type { FocusState } from './types';
import type { AgentInstance } from './useAgentBootstrap';

/**
 * Focus is per-dataset: the toolkit emits `focus-change` carrying the owning
 * datasetId, and prev/next navigation feeds that id back. UI-driven focus
 * operations (panel clicks, cluster pins) resolve the owning dataset by looking
 * up the first incident id, falling back to the latest dataset when the id has
 * not yet been published.
 */
export function useFocus(agent: AgentInstance | undefined) {
    const [focus, setFocus] = useState<FocusState>(null);
    const [focusIndex, setFocusIndex] = useState(0);

    useEffect(() => {
        if (!agent) return;
        const unsub = agent.state.trafficIncidents.events.on('focus-change', ({ datasetId, focus: f }) => {
            if (f) {
                setFocus({ datasetId, ids: [...f.ids], reason: f.reason });
                setFocusIndex(0);
                if (f.ids.size > 0) {
                    agent.state.trafficIncidents.navigateFocus(datasetId, 0);
                }
            } else {
                setFocus(null);
                setFocusIndex(0);
            }
        });
        return () => {
            unsub();
            setFocus(null);
            setFocusIndex(0);
        };
    }, [agent]);

    const focusCount = focus?.ids.length ?? 0;
    const navigateFocus = (i: number) => {
        if (!agent || !focus || focusCount === 0) return;
        const next = ((i % focusCount) + focusCount) % focusCount;
        setFocusIndex(next);
        agent.state.trafficIncidents.navigateFocus(focus.datasetId, next);
    };

    // Focuses the ids on the dataset holding the first one. Triage panels show items from the latest
    // dataset, so the latest dataset is the natural fallback. Returns the focused dataset's id.
    const focusOnOwningDataset = (ids: readonly string[], reason: string): string | undefined => {
        if (!agent) return undefined;
        const slice = agent.state.trafficIncidents;
        const firstId = ids[0];
        const owning = firstId ? slice.findFeature(firstId)?.dataset : undefined;
        const targetId = owning?.id ?? slice.latestDataset?.id;
        if (targetId) slice.setFocus(targetId, ids, reason);
        return targetId;
    };

    const focusOneIncident = (id: string) => {
        focusOnOwningDataset([id], 'Selected from triage');
    };

    const focusCluster = (c: Cluster) => {
        if (!agent) return;
        const targetId = focusOnOwningDataset(c.incidentIds, `Cluster · ${c.headline}`);
        if (!targetId) return;
        const features = agent.state.trafficIncidents.focusedFeatures(targetId);
        if (features.length === 0) return;
        const bbox = bboxFromGeoJSON({ type: 'FeatureCollection', features });
        if (!bbox) return;
        agent.state.baseMap.mapLibreMap.fitBounds(bbox, {
            padding: 120,
            maxZoom: 15,
            duration: 600,
        });
    };

    const clearFocus = () => {
        if (!agent || !focus) return;
        agent.state.trafficIncidents.clearFocus(focus.datasetId);
    };

    return {
        focus,
        focusIndex,
        focusPrev: () => navigateFocus(focusIndex - 1),
        focusNext: () => navigateFocus(focusIndex + 1),
        clearFocus,
        focusOneIncident,
        focusMany: focusOnOwningDataset,
        focusCluster,
    };
}
