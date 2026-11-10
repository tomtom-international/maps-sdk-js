import type { RoutesDataset } from '@tomtom-org/maps-sdk-plugin-agent-toolkit';
import { countLabel } from '../countLabel';
import { DatasetPanel, type SlicePanelProps } from './DatasetPanel';

const summary = (dataset: RoutesDataset): string => {
    const main = dataset.data.features[0]?.properties?.summary;
    if (!main) return countLabel(dataset.data.features.length, 'route');
    const km = Math.round(main.lengthInMeters / 1000);
    const min = Math.round(main.travelTimeInSeconds / 60);
    const alts = dataset.data.features.length - 1;
    return `${km} km · ${min} min${alts > 0 ? ` · +${alts} alt` : ''}`;
};

export function RoutesPanel({ agent, ...props }: SlicePanelProps<RoutesDataset>) {
    return (
        <DatasetPanel
            {...props}
            slice={agent.state.routing}
            noun="routes"
            title="Routes"
            hint="Pin a route to overlay it permanently, or open details for the route stats."
            emptyMessage="No routes calculated yet. Ask the assistant to plan one."
            summary={summary}
        />
    );
}
