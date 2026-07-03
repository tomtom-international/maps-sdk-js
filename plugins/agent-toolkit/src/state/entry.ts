/**
 * @module agent-toolkit-state
 *
 * Shared base shape for the per-slice history entries (places / routes / ranges / byod /
 * custom-geometries / traffic-area-analytics / traffic-incidents). Every slice keeps an append-only
 * history of entries, and they all share the same four fields — an `id`, a `timestamp`, a `label`,
 * and a single `data` payload. Those live here so each slice's entry type can be written as
 * `BaseEntry<TPayload> & { … }` plus only the fields unique to that slice (its per-entry display and
 * runtime state).
 *
 * @group Agent Toolkit
 */

/**
 * The fields shared by every history entry across the toolkit's state slices: identity
 * (`id`), provenance (`timestamp`, `label`), and the slice's payload (`data`). Each slice intersects
 * this with its own per-entry display state — e.g. `type RoutesEntry = BaseEntry<Routes> & { … }`.
 *
 * @typeParam TData - the entry's payload type (e.g. `Routes`, `Place[]`, `FeatureCollection`,
 * `TrafficIncident[]`). It is the single result the entry was created to hold.
 *
 * @group Agent Toolkit
 */
export type BaseEntry<TData> = {
    /**
     * Stable, slice-unique entry id (e.g. `places-0`, or a caller-supplied id deduped against
     * existing entries on collision). Used to address the entry from tools and recall surfaces.
     */
    id: string;
    /**
     * Creation / last-refresh time, in milliseconds since the epoch. Set when the entry is added and
     * bumped on each in-place replace (a monitored re-run stamps the source sample time).
     */
    timestamp: number;
    /** Short, human-readable label for the entry — shown in recall / recents surfaces. */
    label: string;
    /** The entry's payload — the single result this entry was created to hold. */
    data: TData;
};
