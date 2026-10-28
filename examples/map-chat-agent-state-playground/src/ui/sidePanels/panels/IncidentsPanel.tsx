import type { DatasetMode, TrafficIncidentsDataset } from '@tomtom-org/maps-sdk-plugin-agent-toolkit';
import { DatasetModeToggle } from '../DatasetModeToggle';
import { type Agent, useSliceSnapshot } from '../useAgentSnapshot';
import type { VisibilityMode } from '../VisibilityToggle';
import { DatasetList } from './DatasetList';
import { ModeRow } from './ModeRow';
import { PanelShell } from './PanelShell';

type IncidentsPanelProps = {
    agent: Agent;
    datasets: readonly TrafficIncidentsDataset[];
    onShowDetails: (dataset: TrafficIncidentsDataset) => void;
    onDelete: (dataset: TrafficIncidentsDataset) => void;
    visibility: (id: string) => VisibilityMode;
    onVisibilityChange: (id: string, mode: VisibilityMode) => void;
};

const summary = (dataset: TrafficIncidentsDataset): string => {
    const count = dataset.data.length;
    const word = count === 1 ? 'incident' : 'incidents';
    return `${count} ${word}`;
};

export function IncidentsPanel({
    agent,
    datasets,
    onShowDetails,
    onDelete,
    visibility,
    onVisibilityChange,
}: IncidentsPanelProps) {
    const datasetMode = useSliceSnapshot(
        agent.state.trafficIncidents.events,
        'mode-change',
        () => agent.state.trafficIncidents.datasetMode,
    );
    const handleModeChange = (mode: DatasetMode) => {
        void agent.state.trafficIncidents
            .setDatasetMode(mode)
            .catch((error) => console.error('Failed to set incidents mode', error));
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
            // Sequential — concurrent show/hide/clear calls race the SDK/MapLibre state machine.
            const shown = [...agent.state.trafficIncidents.shownDatasetIds];
            for (const id of shown) {
                await agent.state.trafficIncidents.hideDataset(id);
            }
        } catch (error) {
            console.error('Failed to clear incidents', error);
        }
    };

    return (
        <PanelShell
            title="Traffic incidents"
            hint="Per-area incident snapshots fetched by the agent. Pin to keep on the map, or open details."
            action={{ label: 'Hide all', onClick: clearShown }}
            controls={
                <ModeRow>
                    <DatasetModeToggle value={datasetMode} onChange={handleModeChange} />
                </ModeRow>
            }
        >
            <DatasetList
                items={items}
                emptyMessage='No incident snapshots yet. Ask the assistant for "incidents around …".'
                onShowDetails={handleShow}
                onDelete={handleDelete}
                visibility={visibility}
                onVisibilityChange={onVisibilityChange}
            />
        </PanelShell>
    );
}
