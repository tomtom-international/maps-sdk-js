import type { DatasetMode, TrafficAreaAnalyticsDataset } from '@tomtom-org/maps-sdk-plugin-agent-toolkit';
import { DatasetModeToggle } from '../DatasetModeToggle';
import { type Agent, useSliceSnapshot } from '../useAgentSnapshot';
import type { VisibilityMode } from '../VisibilityToggle';
import { DatasetList } from './DatasetList';
import { ModeRow } from './ModeRow';
import { PanelShell } from './PanelShell';

type AreaAnalyticsPanelProps = {
    agent: Agent;
    datasets: readonly TrafficAreaAnalyticsDataset[];
    onShowDetails: (dataset: TrafficAreaAnalyticsDataset) => void;
    onDelete: (dataset: TrafficAreaAnalyticsDataset) => void;
    visibility: (id: string) => VisibilityMode;
    onVisibilityChange: (id: string, mode: VisibilityMode) => void;
};

const summary = (dataset: TrafficAreaAnalyticsDataset): string => {
    const regions = dataset.data.features.length;
    const word = regions === 1 ? 'region' : 'regions';
    return `${regions} ${word}`;
};

export function AreaAnalyticsPanel({
    agent,
    datasets,
    onShowDetails,
    onDelete,
    visibility,
    onVisibilityChange,
}: AreaAnalyticsPanelProps) {
    const datasetMode = useSliceSnapshot(
        agent.state.trafficAreaAnalytics.events,
        'mode-change',
        () => agent.state.trafficAreaAnalytics.datasetMode,
    );
    const handleModeChange = (mode: DatasetMode) => {
        void agent.state.trafficAreaAnalytics
            .setDatasetMode(mode)
            .catch((error) => console.error('Failed to set traffic-area-analytics mode', error));
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
            const shown = [...agent.state.trafficAreaAnalytics.shownDatasetIds];
            for (const id of shown) {
                await agent.state.trafficAreaAnalytics.hideDataset(id);
            }
        } catch (error) {
            console.error('Failed to clear area analytics', error);
        }
    };

    return (
        <PanelShell
            title="Area analytics"
            hint="Historical traffic aggregations (congestion/speed/travel-time hexes). Pin to keep on the map."
            action={{ label: 'Hide all', onClick: clearShown }}
            controls={
                <ModeRow>
                    <DatasetModeToggle value={datasetMode} onChange={handleModeChange} />
                </ModeRow>
            }
        >
            <DatasetList
                items={items}
                emptyMessage='No analytics yet. Ask the assistant for "traffic last week in …".'
                onShowDetails={handleShow}
                onDelete={handleDelete}
                visibility={visibility}
                onVisibilityChange={onVisibilityChange}
            />
        </PanelShell>
    );
}
