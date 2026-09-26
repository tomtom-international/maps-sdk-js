import type { TomTomMap } from '../TomTomMap';

/**
 * Per-map, per-class module instances.
 *
 * A `WeakMap` keyed on the map means a module lives exactly as long as the map it controls, and
 * needs no explicit teardown: drop the map and its modules go with it.
 *
 * The **promise** is stored rather than the instance, because `get()` is asynchronous. Two callers
 * that ask before the map is ready would otherwise both miss the cache and build a second
 * controller over the same style layers — precisely what sharing exists to prevent.
 */
const instancesByMap = new WeakMap<TomTomMap, Map<Function, Promise<unknown>>>();

/**
 * Returns the shared instance of a style-owned module for this map, building it on first use.
 *
 * Style-owned modules control sources and layers the map style already provides, under fixed
 * global IDs, so a second instance would be a second controller over one piece of shared state.
 * Callers get the same instance instead — two components each asking for the terrain is reasonable
 * code, and making them hoist a shared reference would be work pushed onto them for no benefit.
 *
 * @param map The map the module belongs to.
 * @param moduleClass The concrete module class, which together with the map identifies the instance.
 * @param construct Builds the instance. Called at most once per map and class.
 * @param applyToExisting Applies the caller's configuration to an instance that already exists.
 * Omit it when the caller passed no configuration: `get(map)` is a plain accessor and must not
 * re-apply defaults over settings someone else already made.
 *
 * @ignore
 */
export const sharedInstance = async <MODULE>(
    map: TomTomMap,
    moduleClass: Function,
    construct: () => MODULE,
    applyToExisting?: (existing: MODULE) => void,
): Promise<MODULE> => {
    let instances = instancesByMap.get(map);
    if (!instances) {
        instances = new Map();
        instancesByMap.set(map, instances);
    }

    const existing = instances.get(moduleClass) as Promise<MODULE> | undefined;
    if (existing) {
        const instance = await existing;
        applyToExisting?.(instance);
        return instance;
    }

    // Stored before awaiting anything, so a concurrent call joins this promise instead of
    // starting a second construction.
    const created = Promise.resolve().then(construct);
    instances.set(moduleClass, created);
    try {
        return await created;
    } catch (error) {
        // A failed construction must not be cached: the next call should be able to try again,
        // for instance once the style carrying the module's source has loaded.
        instances.delete(moduleClass);
        throw error;
    }
};
