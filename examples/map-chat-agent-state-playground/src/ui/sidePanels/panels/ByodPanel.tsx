import type { BYODDataset } from '@tomtom-org/maps-sdk-plugin-agent-toolkit';
import { countLabel } from '../countLabel';
import type { Agent } from '../useAgentSnapshot';
import { DatasetPanel, type SlicePanelProps } from './DatasetPanel';

const SOURCE_LABELS: Record<BYODDataset['producedFrom']['kind'], string> = {
    integrator: 'app-seeded',
    url: 'url',
    inline: 'inline',
};

// Compact "what is this layer" summary built from the runtime profile — source
// origin, feature count, and the geometry types present, so the user can scan
// at a glance ("url · 42 features · Point, Polygon") instead of opening details.
const summary = (agent: Agent, dataset: BYODDataset): string => {
    const geometry = agent.state.byod.profile(dataset.id)?.geometryTypes.join(', ') || 'no geometry';
    return `${SOURCE_LABELS[dataset.producedFrom.kind]} · ${countLabel(dataset.data.features.length, 'feature')} · ${geometry}`;
};

export function ByodPanel({ agent, ...props }: SlicePanelProps<BYODDataset>) {
    return (
        <DatasetPanel
            {...props}
            slice={agent.state.byod}
            noun="BYOD layers"
            title="Bring your own data"
            hint="Customer-authored GeoJSON layers the assistant can read, render, and pipe through analyse / process. Pin to keep on the map or open details for the inferred schema."
            emptyMessage="No BYOD layers yet. Seed one from the embedding app, or ask the assistant to add GeoJSON from a URL or inline data."
            summary={(dataset) => summary(agent, dataset)}
        />
    );
}
