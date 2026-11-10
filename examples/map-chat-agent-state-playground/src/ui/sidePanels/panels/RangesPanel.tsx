import { type RangesDataset, rangesOf } from '@tomtom-org/maps-sdk-plugin-agent-toolkit';
import { DatasetPanel, type SlicePanelProps } from './DatasetPanel';

const summary = (dataset: RangesDataset): string => {
    // Multi-origin datasets carry the same budgets across every range, so we
    // sample the first range for the budget summary and prefix the origin
    // count to disambiguate "30 min from one place" vs "30 min from three".
    const ranges = rangesOf(dataset.data);
    const budgets = ranges[0]?.budgets ?? [];
    const budgetStr = budgets
        .map((b) => {
            if (b.type === 'timeMinutes') return `${b.value} min`;
            if (b.type === 'distanceKM') return `${b.value} km`;
            return `${b.value} ${b.type}`;
        })
        .join(', ');
    return ranges.length === 1 ? budgetStr : `${ranges.length} origins · ${budgetStr}`;
};

export function RangesPanel({ agent, ...props }: SlicePanelProps<RangesDataset>) {
    return (
        <DatasetPanel
            {...props}
            slice={agent.state.ranges}
            noun="ranges"
            title="Reachable ranges"
            hint="Pin a range to keep it on the map, or open details for its analyses."
            emptyMessage="No ranges computed yet. Ask the assistant for an isochrone."
            summary={summary}
        />
    );
}
