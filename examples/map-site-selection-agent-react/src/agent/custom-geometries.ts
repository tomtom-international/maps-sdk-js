import type { CustomGeometriesDataset, ToolState } from '@tomtom-org/maps-sdk-plugin-agent-toolkit';

/**
 * Replaces every custom-geometries dataset produced by `operation` with one holding `features`, and
 * returns its id. With no features it only removes them, and returns `undefined`.
 */
export const replaceGeometriesByOperation = async (
    state: ToolState,
    operation: string,
    label: string,
    features: CustomGeometriesDataset['data']['features'],
): Promise<string | undefined> => {
    const datasets = state.customGeometries.datasets.filter((dataset) => dataset.producedFrom.operation === operation);
    for (const dataset of datasets) await state.customGeometries.removeDataset(dataset.id);
    if (features.length === 0) return undefined;
    return state.customGeometries.addDataset({
        label,
        data: { type: 'FeatureCollection', features },
        producedFrom: { operation, sourceIds: [] },
    });
};
