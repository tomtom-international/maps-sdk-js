import { bboxFromGeoJSON, type HasBBox } from '@tomtom-org/maps-sdk/core';
import type {
    BYODDataset,
    CustomGeometriesDataset,
    RangesDataset,
    RoutesDataset,
} from '@tomtom-org/maps-sdk-plugin-agent-toolkit';
import type { Agent } from './useAgentSnapshot';

const frame = (agent: Agent, data: HasBBox, padding: number) => {
    const bbox = bboxFromGeoJSON(data);
    if (bbox) agent.state.baseMap.mapLibreMap.fitBounds(bbox, { padding });
};

/**
 * Render a stored route on the map and frame it with the camera.
 *
 * Picks the routing module, redraws the route + waypoints, and fits the camera to the route
 * bbox. Kept here (not in the plugin) so the demo can call it directly from UI handlers without
 * spinning up the full tool pipeline.
 */
export async function showRouteDataset(agent: Agent, dataset: RoutesDataset): Promise<void> {
    // RoutingModules are per-dataset: `showDataset` lazy-inits the dataset's own module and, only in
    // `single` dataset mode, hides the other shown routes. The rail hides its previous selection itself.
    await agent.state.routing.showDataset(dataset.id);
    frame(agent, dataset.data, 64);
}

/**
 * Render every stored reachable-range polygon in a dataset on the map and frame
 * the union. Drops origin pins so the user can see which origins the dataset
 * came from. No-op for datasets stored without polygons (defensive — should
 * never happen in practice).
 */
export async function showRangeDataset(agent: Agent, dataset: RangesDataset): Promise<void> {
    if (dataset.data.features.length === 0) return;
    // The slice keeps lazy modules per dataset, so several can be drawn at once and switching the active
    // dataset only swaps modules, not data. The origin pins are labelled with each range's query or coordinates.
    await agent.state.ranges.showDataset(dataset.id, { fillStyle: 'outline' });
    frame(agent, dataset.data, 50);
}

/**
 * Render a custom-geometries dataset's polygons on the map and frame the bbox.
 *
 * The slice's `showDataset` handles the per-dataset GeometriesModule lifecycle (single-mode
 * hides siblings, fill style application); this helper layers the camera fit
 * on top so the rail's "show details" affordance matches `showRangeDataset`.
 */
export async function showCustomGeometriesDataset(agent: Agent, dataset: CustomGeometriesDataset): Promise<void> {
    if (dataset.data.features.length === 0) return;
    await agent.state.customGeometries.showDataset(dataset.id);
    frame(agent, dataset.data, 50);
}

/**
 * Render a BYOD (bring-your-own-data) dataset's customer GeoJSON on the map and
 * frame its bbox.
 *
 * The slice's `showDataset` owns the per-dataset CustomGeoJSONModule lifecycle
 * (single-mode hides siblings); this helper layers the camera fit
 * on top so the rail's "show details" affordance matches the other slices.
 */
export async function showByodDataset(agent: Agent, dataset: BYODDataset): Promise<void> {
    // The slice draws nothing for a dataset without layers, so there is nothing to frame either.
    if (dataset.data.features.length === 0 || agent.state.byod.getDatasetLayers(dataset.id).length === 0) return;
    await agent.state.byod.showDataset(dataset.id);
    frame(agent, dataset.data, 50);
}
