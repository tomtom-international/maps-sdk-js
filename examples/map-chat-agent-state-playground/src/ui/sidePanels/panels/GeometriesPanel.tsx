import type { CustomGeometriesDataset, DatasetMode } from '@tomtom-org/maps-sdk-plugin-agent-toolkit';
import { DatasetModeToggle } from '../DatasetModeToggle';
import { type Agent, useSliceSnapshot } from '../useAgentSnapshot';
import type { VisibilityMode } from '../VisibilityToggle';
import { DatasetList } from './DatasetList';
import { ModeRow } from './ModeRow';
import { PanelShell } from './PanelShell';

type GeometriesPanelProps = {
    agent: Agent;
    datasets: readonly CustomGeometriesDataset[];
    onShowDetails: (dataset: CustomGeometriesDataset) => void;
    onDelete: (dataset: CustomGeometriesDataset) => void;
    visibility: (id: string) => VisibilityMode;
    onVisibilityChange: (id: string, mode: VisibilityMode) => void;
};

const KIND_LABELS: Record<string, string> = {
    place: 'place',
    places: 'places-datasets',
    ranges: 'ranges',
    custom: 'custom',
};

// Compact "what fed this dataset" summary built from the tagged source list — counts each
// `kind` so the user can scan at a glance ("union · 3 places + 1 ranges") instead of
// reading every id verbatim.
const summary = (dataset: CustomGeometriesDataset): string => {
    const counts: Record<string, number> = {};
    for (const source of dataset.provenance.sourceIds) {
        counts[source.kind] = (counts[source.kind] ?? 0) + 1;
    }
    const breakdown =
        Object.entries(counts)
            .map(([kind, count]) => `${count} ${KIND_LABELS[kind] ?? kind}`)
            .join(' + ') || 'no sources';
    const op = dataset.provenance.operation ?? 'custom';
    const featureWord = dataset.data.length === 1 ? 'feature' : 'features';
    return `${op} · ${dataset.data.length} ${featureWord} · ${breakdown}`;
};

export function GeometriesPanel({
    agent,
    datasets,
    onShowDetails,
    onDelete,
    visibility,
    onVisibilityChange,
}: GeometriesPanelProps) {
    const datasetMode = useSliceSnapshot(
        agent.state.customGeometries.events,
        'mode-change',
        () => agent.state.customGeometries.datasetMode,
    );
    const handleModeChange = (mode: DatasetMode) => {
        void agent.state.customGeometries
            .setDatasetMode(mode)
            .catch((error) => console.error('Failed to set custom-geometries mode', error));
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
            const shown = [...agent.state.customGeometries.shownDatasetIds];
            for (const id of shown) {
                await agent.state.customGeometries.hideDataset(id);
            }
        } catch (error) {
            console.error('Failed to clear custom geometries', error);
        }
    };

    return (
        <PanelShell
            title="Custom geometries"
            hint="Polygons produced by processData — unions, buffers, h3 coverage. Pin to keep on the map or open details for analyses."
            action={{ label: 'Hide all', onClick: clearShown }}
            controls={
                <ModeRow>
                    <DatasetModeToggle value={datasetMode} onChange={handleModeChange} />
                </ModeRow>
            }
        >
            <DatasetList
                items={items}
                emptyMessage="No custom geometries yet. Ask the assistant to union, buffer, or compute coverage of polygons."
                onShowDetails={handleShow}
                onDelete={handleDelete}
                visibility={visibility}
                onVisibilityChange={onVisibilityChange}
            />
        </PanelShell>
    );
}
