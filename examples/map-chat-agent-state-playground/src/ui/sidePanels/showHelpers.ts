import { bboxFromGeoJSON, type HasBBox, type Place, type PolygonFeatures } from '@tomtom-org/maps-sdk/core';
import type {
    BYODEntry,
    CustomGeometriesEntry,
    RangesEntry,
    RoutesEntry,
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
export async function showRouteEntry(agent: Agent, entry: RoutesEntry): Promise<void> {
    // RoutingModules are per-entry: `showEntry` lazy-inits the entry's own module and, only in
    // `single` entry mode, hides the other shown routes. The rail hides its previous selection itself.
    await agent.state.routing.showEntry(entry.id);
    const bbox = bboxFromGeoJSON(entry.data as HasBBox);
    if (bbox) {
        agent.state.baseMap.mapLibreMap.fitBounds(bbox as LngLatBoundsLike, { padding: 64 });
    }
}

/**
 * Render every stored reachable-range polygon in an entry on the map and frame
 * the union. Drops origin pins so the user can see which origins the entry
 * came from. No-op for entries stored without polygons (defensive — should
 * never happen in practice).
 */
export async function showRangeEntry(agent: Agent, entry: RangesEntry): Promise<void> {
    const features = entry.data.flatMap((r) => r.polygon?.features ?? []);
    if (features.length === 0) return;
    const merged: PolygonFeatures = { type: 'FeatureCollection', features };
    // Per-entry ReachableRangesModule + PlacesModule — each ranges entry owns its
    // own pair so multiple entries can be drawn at once and switching the
    // active entry only swaps modules, not data.
    const rangesModule = await agent.state.ranges.getEntryRangesModule(entry.id, 'outline');
    await rangesModule.show(merged);

    // Origin pins sit alongside the polygons — one per range, labelled with
    // its query (or coordinates) so the user can identify each origin.
    const placesModule = await agent.state.ranges.getEntryPlacesModule(entry.id);
    const originPlaces: Place[] = entry.data.map((r, i) => ({
        type: 'Feature',
        id: `range-origin-${entry.id}-${i}`,
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
    await agent.state.ranges.markEntryShown(entry.id);
}

/**
 * Render a custom-geometries entry's polygons on the map and frame the bbox.
 *
 * The slice's `showEntry` handles the per-entry GeometriesModule lifecycle (single-mode
 * hides siblings, fill style application, `_shown` flag); this helper layers the camera fit
 * on top so the rail's "show details" affordance matches `showRangeEntry`.
 */
export async function showCustomGeometriesEntry(agent: Agent, entry: CustomGeometriesEntry): Promise<void> {
    if (entry.data.length === 0) return;
    await agent.state.customGeometries.showEntry(entry.id);
    const bbox = bboxFromGeoJSON({
        type: 'FeatureCollection',
        features: entry.data,
    } as unknown as HasBBox);
    if (bbox) {
        agent.state.baseMap.mapLibreMap.fitBounds(bbox as LngLatBoundsLike, { padding: 50 });
    }
}

/**
 * Render a BYOD (bring-your-own-data) entry's customer GeoJSON on the map and
 * frame its bbox.
 *
 * The slice's `showEntry` owns the per-entry CustomGeoJSONModule lifecycle
 * (single-mode hides siblings, `_shown` flag); this helper layers the camera fit
 * on top so the rail's "show details" affordance matches the other slices.
 */
export async function showByodEntry(agent: Agent, entry: BYODEntry): Promise<void> {
    // The slice draws nothing for an entry without layers, so there is nothing to frame either.
    if (entry.data.features.length === 0 || entry.layers.length === 0) return;
    await agent.state.byod.showEntry(entry.id);
    const bbox = bboxFromGeoJSON(entry.data as unknown as HasBBox);
    if (bbox) {
        agent.state.baseMap.mapLibreMap.fitBounds(bbox as LngLatBoundsLike, { padding: 50 });
    }
}
