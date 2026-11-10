import type { PlacesDataset } from '@tomtom-org/maps-sdk-plugin-agent-toolkit';
import { countLabel } from '../countLabel';
import { DatasetPanel, type SlicePanelProps } from './DatasetPanel';

const summary = (dataset: PlacesDataset): string => countLabel(dataset.data.features.length, 'place');

export function PlacesPanel({ agent, ...props }: SlicePanelProps<PlacesDataset>) {
    return (
        <DatasetPanel
            {...props}
            slice={agent.state.places}
            noun="places"
            title="Places"
            hint="Pin datasets to keep them on the map, or open details to inspect them."
            emptyMessage="No places stored yet. Ask the assistant to find some."
            summary={summary}
        />
    );
}
