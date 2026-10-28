import type { BYODDataset, DatasetMode } from '@tomtom-org/maps-sdk-plugin-agent-toolkit';
import { DatasetModeToggle } from '../DatasetModeToggle';
import { type Agent, useSliceSnapshot } from '../useAgentSnapshot';
import type { VisibilityMode } from '../VisibilityToggle';
import { DatasetList } from './DatasetList';
import { ModeRow } from './ModeRow';
import { PanelShell } from './PanelShell';

type ByodPanelProps = {
    agent: Agent;
    datasets: readonly BYODDataset[];
    onShowDetails: (dataset: BYODDataset) => void;
    onDelete: (dataset: BYODDataset) => void;
    visibility: (id: string) => VisibilityMode;
    onVisibilityChange: (id: string, mode: VisibilityMode) => void;
};

const SOURCE_LABELS: Record<BYODDataset['source']['kind'], string> = {
    integrator: 'app-seeded',
    url: 'url',
    inline: 'inline',
};

// Compact "what is this layer" summary built from the runtime profile — source
// origin, feature count, and the geometry types present, so the user can scan
// at a glance ("url · 42 features · Point, Polygon") instead of opening details.
const summary = (dataset: BYODDataset): string => {
    const featureWord = dataset.profile.featureCount === 1 ? 'feature' : 'features';
    const geometry = dataset.profile.geometryTypes.join(', ') || 'no geometry';
    return `${SOURCE_LABELS[dataset.source.kind]} · ${dataset.profile.featureCount} ${featureWord} · ${geometry}`;
};

export function ByodPanel({ agent, datasets, onShowDetails, onDelete, visibility, onVisibilityChange }: ByodPanelProps) {
    const datasetMode = useSliceSnapshot(agent.state.byod.events, 'mode-change', () => agent.state.byod.datasetMode);
    const handleModeChange = (mode: DatasetMode) => {
        void agent.state.byod.setDatasetMode(mode).catch((error) => console.error('Failed to set BYOD mode', error));
    };

    const items = datasets.map((dataset) => ({
        id: dataset.id,
        label: dataset.label,
        subtitle: summary(dataset),
        timestamp: dataset.timestamp,
    }));

    const findDataset = (id: string) => datasets.find((e) => e.id === id);
    const handleShow = (id: string) => {
        const dataset = findDataset(id);
        if (dataset) onShowDetails(dataset);
    };
    const handleDelete = (id: string) => {
        const dataset = findDataset(id);
        if (dataset) onDelete(dataset);
    };

    const clearShown = async () => {
        try {
            // Sequential, not Promise.all — concurrent show/hide/clear calls race the
            // SDK and MapLibre state machine. Await one at a time.
            const shown = [...agent.state.byod.shownDatasetIds];
            for (const id of shown) {
                await agent.state.byod.hideDataset(id);
            }
        } catch (error) {
            console.error('Failed to clear BYOD layers', error);
        }
    };

    return (
        <PanelShell
            title="Bring your own data"
            hint="Customer-authored GeoJSON layers the assistant can read, render, and pipe through analyse / process. Pin to keep on the map or open details for the inferred schema."
            action={{ label: 'Hide all', onClick: clearShown }}
            controls={
                <ModeRow>
                    <DatasetModeToggle value={datasetMode} onChange={handleModeChange} />
                </ModeRow>
            }
        >
            <DatasetList
                items={items}
                emptyMessage="No BYOD layers yet. Seed one from the embedding app, or ask the assistant to add GeoJSON from a URL or inline data."
                onShowDetails={handleShow}
                onDelete={handleDelete}
                visibility={visibility}
                onVisibilityChange={onVisibilityChange}
            />
        </PanelShell>
    );
}
