import type { TrafficIncidentsDataset } from '@tomtom-org/maps-sdk-plugin-agent-toolkit';
import { countLabel } from '../countLabel';
import { DatasetPanel, type SlicePanelProps } from './DatasetPanel';

const summary = (dataset: TrafficIncidentsDataset): string => countLabel(dataset.data.features.length, 'incident');

export function IncidentsPanel({ agent, ...props }: SlicePanelProps<TrafficIncidentsDataset>) {
    return (
        <DatasetPanel
            {...props}
            slice={agent.state.trafficIncidents}
            noun="incidents"
            title="Traffic incidents"
            hint="Per-area incident snapshots fetched by the agent. Pin to keep on the map, or open details."
            emptyMessage='No incident snapshots yet. Ask the assistant for "incidents around …".'
            summary={summary}
        />
    );
}
