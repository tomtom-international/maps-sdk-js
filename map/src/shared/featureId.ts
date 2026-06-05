/**
 * Class-independent feature-id recovery and lookup, shared by the event subsystem and the
 * source/layer caches. Operate on the minimal {@link RenderedRef} shape, so they accept
 * MapLibre `MapGeoJSONFeature`s, plain GeoJSON `Feature`s, and cached originals alike.
 */

/** Minimal shape needed to look a feature up by id. @ignore */
export type RenderedRef = { id?: string | number; properties?: { id?: unknown } | null };

/** A feature together with its index in the array it was found in. @ignore */
export type IndexedFeature<F> = { feature: F; index: number };

/**
 * Recover the SDK-assigned id of a feature, preferring `properties.id` over the top-level `id`.
 *
 * The SDK always stamps the real id into `properties.id` and uses `promoteId: 'id'`, so MapLibre
 * mirrors it onto the top-level `id` — the two are normally identical. The exception is **clustered**
 * GeoJSON sources: clustering disables `promoteId`, and MapLibre's supercluster then assigns its own
 * **synthetic** numeric top-level `id` (0, 1, 2, …) to rendered features. Preferring the top-level
 * `id` there would return that synthetic value and miss the cache, whereas `properties.id` is still
 * the real id. So read `properties.id` first, falling back to the top-level `id` (e.g. vector-tile
 * features that only carry a top-level id). Returns `undefined` when neither is set.
 * @ignore
 */
export const renderedRefId = (rendered: RenderedRef): string | number | undefined => {
    const propId = (rendered.properties as { id?: unknown } | null)?.id;
    // `properties.id` is `unknown`: trust it as the ref id only when it's actually a string/number,
    // else fall back to the (already-typed) top-level id. Keeps the declared return type honest.
    return typeof propId === 'string' || typeof propId === 'number' ? propId : rendered.id;
};

/**
 * Find the first feature whose {@link renderedRefId} equals `id`, with its index, or
 * `undefined` (also for a nullish `id`).
 * @ignore
 */
export const findFeatureByRefId = <F extends RenderedRef>(
    features: readonly F[],
    id: string | number | undefined,
): IndexedFeature<F> | undefined => {
    if (id === undefined || id === null) return undefined;
    for (let index = 0; index < features.length; index++) {
        if (renderedRefId(features[index]) === id) return { feature: features[index], index };
    }
    return undefined;
};
