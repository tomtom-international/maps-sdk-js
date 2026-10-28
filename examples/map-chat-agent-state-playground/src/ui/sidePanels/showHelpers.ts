import { bboxFromGeoJSON, type HasBBox, type Place, type PolygonFeatures } from '@tomtom-org/maps-sdk/core';
import type {
    BYODDataset,
    CustomGeometriesDataset,
    RangesDataset,
    RoutesDataset,
} from '@tomtom-org/maps-sdk-plugin-agent-toolkit';
import type { LngLatBoundsLike } from 'maplibre-gl';
import type { Agent } from './useAgentSnapshot';

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
    const bbox = bboxFromGeoJSON(dataset.data as HasBBox);
    if (bbox) {
        agent.state.baseMap.mapLibreMap.fitBounds(bbox as LngLatBoundsLike, { padding: 64 });
    }
}

/**
 * Render every stored reachable-range polygon in a dataset on the map and frame
 * the union. Drops origin pins so the user can see which origins the dataset
 * came from. No-op for datasets stored without polygons (defensive — should
 * never happen in practice).
 */
export async function showRangeDataset(agent: Agent, dataset: RangesDataset): Promise<void> {
    const features = dataset.data.flatMap((r) => r.polygon?.features ?? []);
    if (features.length === 0) return;
    const merged: PolygonFeatures = { type: 'FeatureCollection', features };
    // Per-dataset ReachableRangesModule + PlacesModule — each ranges dataset owns its
    // own pair so multiple datasets can be drawn at once and switching the
    // active dataset only swaps modules, not data.
    const rangesModule = await agent.state.ranges.getDatasetRangesModule(dataset.id, 'outline');
    await rangesModule.show(merged);

    // Origin pins sit alongside the polygons — one per range, labelled with
    // its query (or coordinates) so the user can identify each origin.
    const placesModule = await agent.state.ranges.getDatasetPlacesModule(dataset.id);
    const originPlaces: Place[] = dataset.data.map((r, i) => ({
        type: 'Feature',
        id: `range-origin-${dataset.id}-${i}`,
        geometry: { type: 'Point', coordinates: r.origin.position },
        properties: {
            type: 'Point Address',
            address: {
                freeformAddress: r.origin.query ?? `${r.origin.position[1]}, ${r.origin.position[0]}`,
            },
        },
    }));
    await placesModule.show(originPlaces);

    const bbox = bboxFromGeoJSON(merged as HasBBox) as HasBBox | undefined;
    if (bbox) {
        agent.state.baseMap.mapLibreMap.fitBounds(bbox as LngLatBoundsLike, { padding: 50 });
    }
    // Track the active selection so the next user prompt can flag it as a UI-driven change.
    await agent.state.ranges.markDatasetShown(dataset.id);
}

/**
 * Render a custom-geometries dataset's polygons on the map and frame the bbox.
 *
 * The slice's `showDataset` handles the per-dataset GeometriesModule lifecycle (single-mode
 * hides siblings, fill style application, `_shown` flag); this helper layers the camera fit
 * on top so the rail's "show details" affordance matches `showRangeDataset`.
 */
export async function showCustomGeometriesDataset(agent: Agent, dataset: CustomGeometriesDataset): Promise<void> {
    if (dataset.data.length === 0) return;
    await agent.state.customGeometries.showDataset(dataset.id);
    const bbox = bboxFromGeoJSON({
        type: 'FeatureCollection',
        features: dataset.data,
    } as unknown as HasBBox);
    if (bbox) {
        agent.state.baseMap.mapLibreMap.fitBounds(bbox as LngLatBoundsLike, { padding: 50 });
    }
}

/**
 * Render a BYOD (bring-your-own-data) dataset's customer GeoJSON on the map and
 * frame its bbox.
 *
 * The slice's `showDataset` owns the per-dataset CustomGeoJSONModule lifecycle
 * (single-mode hides siblings, `_shown` flag); this helper layers the camera fit
 * on top so the rail's "show details" affordance matches the other slices.
 */
export async function showByodDataset(agent: Agent, dataset: BYODDataset): Promise<void> {
    // The slice draws nothing for a dataset without layers, so there is nothing to frame either.
    if (dataset.data.features.length === 0 || dataset.layers.length === 0) return;
    await agent.state.byod.showDataset(dataset.id);
    const bbox = bboxFromGeoJSON(dataset.data as unknown as HasBBox);
    if (bbox) {
        agent.state.baseMap.mapLibreMap.fitBounds(bbox as LngLatBoundsLike, { padding: 50 });
    }
}
