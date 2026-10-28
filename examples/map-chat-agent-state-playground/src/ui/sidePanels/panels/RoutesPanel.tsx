import type { DatasetMode, RoutesDataset } from '@tomtom-org/maps-sdk-plugin-agent-toolkit';
import { DatasetModeToggle } from '../DatasetModeToggle';
import { type Agent, useSliceSnapshot } from '../useAgentSnapshot';
import type { VisibilityMode } from '../VisibilityToggle';
import { DatasetList } from './DatasetList';
import { ModeRow } from './ModeRow';
import { PanelShell } from './PanelShell';

type RoutesPanelProps = {
    agent: Agent;
    datasets: readonly RoutesDataset[];
    onShowDetails: (dataset: RoutesDataset) => void;
    onDelete: (dataset: RoutesDataset) => void;
    visibility: (id: string) => VisibilityMode;
    onVisibilityChange: (id: string, mode: VisibilityMode) => void;
};

const summary = (dataset: RoutesDataset): string => {
    const main = dataset.data.features[0]?.properties?.summary;
    if (!main) return `${dataset.data.features.length} route${dataset.data.features.length === 1 ? '' : 's'}`;
    const km = Math.round(main.lengthInMeters / 1000);
    const min = Math.round(main.travelTimeInSeconds / 60);
    const alts = dataset.data.features.length - 1;
    return `${km} km · ${min} min${alts > 0 ? ` · +${alts} alt` : ''}`;
};

export function RoutesPanel({
    agent,
    datasets,
    onShowDetails,
    onDelete,
    visibility,
    onVisibilityChange,
}: RoutesPanelProps) {
    const datasetMode = useSliceSnapshot(agent.state.routing.events, 'mode-change', () => agent.state.routing.datasetMode);
    const handleModeChange = (mode: DatasetMode) => {
        void agent.state.routing.setDatasetMode(mode).catch((error) => console.error('Failed to set routes mode', error));
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
            // Multi-show capable — hide every currently-shown dataset, not just one.
            const shown = [...agent.state.routing.shownDatasetIds];
            await Promise.all(shown.map((id) => agent.state.routing.hideDataset(id)));
        } catch (error) {
            console.error('Failed to clear routes', error);
        }
    };

    return (
        <PanelShell
            title="Routes"
            hint="Pin a route to overlay it permanently, or open details for the route stats."
            action={{ label: 'Hide all', onClick: clearShown }}
            controls={
                <ModeRow>
                    <DatasetModeToggle value={datasetMode} onChange={handleModeChange} />
                </ModeRow>
            }
        >
            <DatasetList
                items={items}
                emptyMessage="No routes calculated yet. Ask the assistant to plan one."
                onShowDetails={handleShow}
                onDelete={handleDelete}
                visibility={visibility}
                onVisibilityChange={onVisibilityChange}
            />
        </PanelShell>
    );
}
