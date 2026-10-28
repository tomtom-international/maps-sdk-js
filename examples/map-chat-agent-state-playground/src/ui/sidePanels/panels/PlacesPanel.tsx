import type { DatasetMode, PlacesDataset } from '@tomtom-org/maps-sdk-plugin-agent-toolkit';
import { DatasetModeToggle } from '../DatasetModeToggle';
import { type Agent, useSliceSnapshot } from '../useAgentSnapshot';
import type { VisibilityMode } from '../VisibilityToggle';
import { DatasetList } from './DatasetList';
import { ModeRow } from './ModeRow';
import { PanelShell } from './PanelShell';

type PlacesPanelProps = {
    agent: Agent;
    datasets: readonly PlacesDataset[];
    onShowDetails: (dataset: PlacesDataset) => void;
    onDelete: (dataset: PlacesDataset) => void;
    visibility: (id: string) => VisibilityMode;
    onVisibilityChange: (id: string, mode: VisibilityMode) => void;
};

export function PlacesPanel({
    agent,
    datasets,
    onShowDetails,
    onDelete,
    visibility,
    onVisibilityChange,
}: PlacesPanelProps) {
    const datasetMode = useSliceSnapshot(agent.state.places.events, 'mode-change', () => agent.state.places.datasetMode);
    const handleModeChange = (mode: DatasetMode) => {
        void agent.state.places.setDatasetMode(mode).catch((error) => console.error('Failed to set places mode', error));
    };
    const items = datasets.map((dataset) => ({
        id: dataset.id,
        label: dataset.label,
        subtitle: `${dataset.data.length} place${dataset.data.length === 1 ? '' : 's'}`,
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
            await agent.state.places.clearShownDatasets();
        } catch (error) {
            console.error('Failed to clear shown places', error);
        }
    };

    return (
        <PanelShell
            title="Places"
            hint="Pin datasets to keep them on the map, or open details to inspect them."
            action={{ label: 'Hide all', onClick: clearShown }}
            controls={
                <ModeRow>
                    <DatasetModeToggle value={datasetMode} onChange={handleModeChange} />
                </ModeRow>
            }
        >
            <DatasetList
                items={items}
                emptyMessage="No places stored yet. Ask the assistant to find some."
                onShowDetails={handleShow}
                onDelete={handleDelete}
                visibility={visibility}
                onVisibilityChange={onVisibilityChange}
            />
        </PanelShell>
    );
}
