import type { TrafficAreaAnalyticsDataset } from '@tomtom-org/maps-sdk-plugin-agent-toolkit';
import { countLabel } from '../countLabel';
import { DatasetPanel, type SlicePanelProps } from './DatasetPanel';

const summary = (dataset: TrafficAreaAnalyticsDataset): string => countLabel(dataset.data.features.length, 'region');

export function AreaAnalyticsPanel({ agent, ...props }: SlicePanelProps<TrafficAreaAnalyticsDataset>) {
    return (
        <DatasetPanel
            {...props}
            slice={agent.state.trafficAreaAnalytics}
            noun="area analytics"
            title="Area analytics"
            hint="Historical traffic aggregations (congestion/speed/travel-time hexes). Pin to keep on the map."
            emptyMessage='No analytics yet. Ask the assistant for "traffic last week in …".'
            summary={summary}
        />
    );
}
