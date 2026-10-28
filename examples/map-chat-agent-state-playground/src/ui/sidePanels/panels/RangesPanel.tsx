import type { DatasetMode, RangesDataset } from '@tomtom-org/maps-sdk-plugin-agent-toolkit';
import { DatasetModeToggle } from '../DatasetModeToggle';
import { type Agent, useSliceSnapshot } from '../useAgentSnapshot';
import type { VisibilityMode } from '../VisibilityToggle';
import { DatasetList } from './DatasetList';
import { ModeRow } from './ModeRow';
import { PanelShell } from './PanelShell';

type RangesPanelProps = {
    agent: Agent;
    datasets: readonly RangesDataset[];
    onShowDetails: (dataset: RangesDataset) => void;
    onDelete: (dataset: RangesDataset) => void;
    visibility: (id: string) => VisibilityMode;
    onVisibilityChange: (id: string, mode: VisibilityMode) => void;
};

const summary = (dataset: RangesDataset): string => {
    // Multi-origin datasets carry the same budgets across every range, so we
    // sample the first range for the budget summary and prefix the origin
    // count to disambiguate "30 min from one place" vs "30 min from three".
    const budgets = dataset.data[0]?.budgets ?? [];
    const budgetStr = budgets
        .map((b) => {
            if (b.type === 'timeMinutes') return `${b.value} min`;
            if (b.type === 'distanceKM') return `${b.value} km`;
            return `${b.value} ${b.type}`;
        })
        .join(', ');
    return dataset.data.length === 1 ? budgetStr : `${dataset.data.length} origins · ${budgetStr}`;
};

export function RangesPanel({
    agent,
    datasets,
    onShowDetails,
    onDelete,
    visibility,
    onVisibilityChange,
}: RangesPanelProps) {
    const datasetMode = useSliceSnapshot(agent.state.ranges.events, 'mode-change', () => agent.state.ranges.datasetMode);
    const handleModeChange = (mode: DatasetMode) => {
        void agent.state.ranges.setDatasetMode(mode).catch((error) => console.error('Failed to set ranges mode', error));
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
            // hideDataset handles polygon + origin-pin clears AND emits
            // shown-change. Walk every currently-shown id.
            const shown = [...agent.state.ranges.shownDatasetIds];
            await Promise.all(shown.map((id) => agent.state.ranges.hideDataset(id)));
        } catch (error) {
            console.error('Failed to clear ranges', error);
        }
    };

    return (
        <PanelShell
            title="Reachable ranges"
            hint="Pin a range to keep it on the map, or open details for its analyses."
            action={{ label: 'Hide all', onClick: clearShown }}
            controls={
                <ModeRow>
                    <DatasetModeToggle value={datasetMode} onChange={handleModeChange} />
                </ModeRow>
            }
        >
            <DatasetList
                items={items}
                emptyMessage="No ranges computed yet. Ask the assistant for an isochrone."
                onShowDetails={handleShow}
                onDelete={handleDelete}
                visibility={visibility}
                onVisibilityChange={onVisibilityChange}
            />
        </PanelShell>
    );
}
