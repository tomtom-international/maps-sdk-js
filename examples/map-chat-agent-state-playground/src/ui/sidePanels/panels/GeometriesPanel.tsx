import type { CustomGeometriesDataset, GeometriesIdKind } from '@tomtom-org/maps-sdk-plugin-agent-toolkit';
import { countLabel } from '../countLabel';
import { DatasetPanel, type SlicePanelProps } from './DatasetPanel';

const KIND_LABELS: Partial<Record<GeometriesIdKind, string>> = {
    place: 'place',
    places: 'places-datasets',
    ranges: 'ranges',
};

// Compact "what fed this dataset" summary built from the tagged source list — counts each
// `kind` so the user can scan at a glance ("union · 3 places + 1 ranges") instead of
// reading every id verbatim.
const summary = (dataset: CustomGeometriesDataset): string => {
    const counts = new Map<GeometriesIdKind, number>();
    for (const source of dataset.producedFrom.sourceIds) {
        counts.set(source.kind, (counts.get(source.kind) ?? 0) + 1);
    }
    const breakdown =
        [...counts].map(([kind, count]) => `${count} ${KIND_LABELS[kind] ?? kind}`).join(' + ') || 'no sources';
    const op = dataset.producedFrom.operation ?? 'custom';
    return `${op} · ${countLabel(dataset.data.features.length, 'feature')} · ${breakdown}`;
};

export function GeometriesPanel({ agent, ...props }: SlicePanelProps<CustomGeometriesDataset>) {
    return (
        <DatasetPanel
            {...props}
            slice={agent.state.customGeometries}
            noun="custom geometries"
            title="Custom geometries"
            hint="Polygons produced by deriveDatasets — unions, buffers, h3 coverage. Pin to keep on the map or open details for analyses."
            emptyMessage="No custom geometries yet. Ask the assistant to union, buffer, or compute coverage of polygons."
            summary={summary}
        />
    );
}
