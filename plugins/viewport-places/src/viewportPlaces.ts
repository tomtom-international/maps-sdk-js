import { generateId, POICategory } from '@tomtom-org/maps-sdk/core';
import { PlacesModule, type PlacesModuleConfig, TomTomMap } from '@tomtom-org/maps-sdk/map';
import { type FuzzySearchParams, SDKAbortError, search } from '@tomtom-org/maps-sdk/services';

/**
 * Common Options when adding a viewport places module.
 *
 * @group Viewport Places
 */
export type ViewportPlacesAddCommonOptions = {
    /**
     * Optional unique identifier for the viewport places module.
     *
     * @remarks
     * * If not provided, a random ID will be generated.
     * * If you need to keep updating or removing this place module later, provide a fixed ID.
     */
    id?: string;
    /**
     * Minimum zoom level at which the place module is visible.
     */
    minZoom?: number;
    /**
     * Maximum zoom level at which the place module is visible.
     */
    maxZoom?: number;
};

/**
 * Full Options when adding a viewport places module.
 *
 * @group Viewport Places
 */
export type ViewportPlacesAddOptions = ViewportPlacesAddCommonOptions & {
    /**
     * The search parameters to query places for this place module.
     *
     * @remarks
     * `signal` is not accepted here: each module owns an `AbortSignal` internally so that a new
     * viewport search cancels the one it supersedes.
     */
    searchOptions: Omit<FuzzySearchParams, 'boundingBox' | 'position' | 'signal'>;
    /**
     * Optional configuration for the places module, such as styling.
     */
    placesModuleConfig?: PlacesModuleConfig;
};

/**
 * Options when updating a viewport places module.
 *
 * @group Viewport Places
 */
export type ViewportPlacesOptions = Omit<ViewportPlacesAddOptions, 'id'> & {
    /**
     * The unique identifier of the place module to update.
     * @remarks
     * * This ID must correspond to an existing place module added via an "add" method.
     */
    id: string;
};

/**
 * A class for managing dynamic searched place modules on a TomTom map.
 *
 * It leverages the SDK search service to maintain place modules that automatically
 * update and stay current as the map viewport changes.
 *
 * @group Viewport Places
 */
export class ViewportPlaces {
    /**
     * Internal map of registered place modules, keyed by their `id`.
     * @private
     */
    private registeredModules: Record<
        string,
        {
            options: ViewportPlacesAddOptions;
            placesModule: PlacesModule;
            subscription: any;
            /** Cancels this module's in-flight search when a newer viewport supersedes it. */
            controller?: AbortController;
        }
    > = {};
    private readonly mapLibreMap;

    /**
     * Creates an instance of ViewportPlaces bound to a TomTom map.
     * @param map - The TomTom map instance to attach place modules to.
     */
    constructor(private readonly map: TomTomMap) {
        this.mapLibreMap = map.mapLibreMap;
    }

    /**
     * Performs the update logic for a registered PlacesModule, cancelling whatever search that
     * module still has in flight.
     * @param id - The unique identifier of the registered place module to refresh.
     */
    private async searchAndDisplay(id: string): Promise<void> {
        const entry = this.registeredModules[id];
        if (!entry) return;

        const { placesModule, options } = entry;

        // The previous viewport's search is stale. Must precede the zoom guard below: that path
        // clears and returns early, and a search left running would repopulate what it cleared.
        entry.controller?.abort();

        const zoom = this.mapLibreMap.getZoom();
        if ((options.minZoom && zoom < options.minZoom) || (options.maxZoom && zoom > options.maxZoom)) {
            await placesModule.clear();
            return;
        }

        const controller = new AbortController();
        entry.controller = controller;

        try {
            const places = await search({
                boundingBox: this.map.getBBox(),
                limit: 100,
                ...options.searchOptions,
                signal: controller.signal,
            });
            // Superseded between the response arriving and rendering it
            if (controller.signal.aborted) return;

            await placesModule.show(places);
        } catch (error) {
            if (error instanceof SDKAbortError) return;

            throw error;
        }
    }

    /**
     * Adds a PlacesModule that displays places based on fuzzy search parameters and automatically updates as the map moves.
     *
     * @remarks
     * * Each call to "add" creates a new place module and places it above previously added modules.
     * * Place modules are rendered bottom-up in the order they are added: the first added module is displayed at the bottom, and later modules are stacked on top of earlier ones.
     * * The default places module theme is 'base-map' unless overridden in the options.
     *
     * @param options - The options for the place module.
     * @returns A promise that resolves to the PlacesModule instance managing the module.
     */
    async add(options: ViewportPlacesAddOptions): Promise<PlacesModule> {
        const id = options.id ?? generateId();
        const effectiveOptions = {
            ...options,
            placesModuleConfig: { theme: 'base-map', ...options.placesModuleConfig } as PlacesModuleConfig,
        };

        const placesModule = await PlacesModule.create(this.map, effectiveOptions.placesModuleConfig);
        const searchAndDisplay = () => this.searchAndDisplay(id);

        const subscription = this.mapLibreMap.on('moveend', searchAndDisplay);
        this.registeredModules[id] = { placesModule, subscription, options: effectiveOptions };
        await searchAndDisplay();
        return placesModule;
    }

    /**
     * Adds a PlacesModule for specific POI categories that updates automatically as the map moves.
     * The POIs are shown in the same style as the base map.
     *
     * @remarks
     * * This is a convenience wrapper over `add` that configures a category-based search for a PlacesModule.
     * * Each call creates a new place module that will be stacked on top of previously added modules.
     *
     * @param options - The options for the category-based place module.
     * @returns A promise that resolves to the PlacesModule instance managing the module.
     */
    async addPOICategories(
        options: ViewportPlacesAddCommonOptions & { categories: POICategory[] },
    ): Promise<PlacesModule> {
        return this.add({
            ...options,
            searchOptions: { poiCategories: options.categories },
        });
    }

    /**
     * Removes a specific place module by its ID, stopping its updates and clearing the displayed places.
     * @remarks
     * If the id does not exist, an error is logged into console.
     *
     * @param id - The unique identifier of the PlacesModule to remove.
     */
    remove(id: string): void {
        const entry = this.registeredModules[id];
        if (entry) {
            entry.controller?.abort();
            entry.placesModule.clear();
            entry.subscription.unsubscribe();
            delete this.registeredModules[id];
        } else {
            console.error(`Viewport places module ${id} not found`);
        }
    }

    /**
     * Removes all registered place modules, stopping their updates and clearing all displayed places.
     */
    removeAll(): void {
        Object.keys(this.registeredModules).forEach((key) => this.remove(key));
    }

    /**
     * Updates the search and display options for an existing place module identified by its ID.
     * This will immediately apply the new options and refresh the place module accordingly.
     * @param newOptions - The new options to apply.
     * @throws Error if the place module with the given ID does not exist.
     */
    async update(newOptions: ViewportPlacesOptions): Promise<void> {
        const entry = this.registeredModules[newOptions.id];
        if (!entry) {
            throw new Error(`Place module with id ${newOptions.id} not found`);
        }
        const currentOptions = entry.options;

        // Update the options by merging current and new options:
        entry.options = {
            ...currentOptions,
            ...newOptions,
            // search and places display options are merged incrementally:
            searchOptions: { ...currentOptions.searchOptions, ...newOptions.searchOptions },
            placesModuleConfig: { ...currentOptions.placesModuleConfig, ...newOptions.placesModuleConfig },
        };
        // Update the places module configuration and refresh the display:
        entry.placesModule.applyConfig(entry.options.placesModuleConfig);
        await this.searchAndDisplay(newOptions.id);
    }
}
