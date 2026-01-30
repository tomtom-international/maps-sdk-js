import { generateId, POICategory } from '@tomtom-org/maps-sdk/core';
import { PlacesModule, type PlacesModuleConfig, TomTomMap } from '@tomtom-org/maps-sdk/map';
import { type FuzzySearchParams, search } from '@tomtom-org/maps-sdk/services';

/**
 * Base options for configuring places modules, including optional identifiers and zoom level constraints.
 * @group Viewport Places
 */
export type ViewportPlacesBaseOptions = {
    /**
     * Optional unique identifier for the places module.
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
 * @group Viewport Places
 */
export type ViewportPlacesOptions = ViewportPlacesBaseOptions & {
    /**
     * The fuzzy search parameters to query places for this place module.
     */
    searchOptions: FuzzySearchParams;
    /**
     * Optional configuration for the places module, such as styling.
     */
    placesModuleConfig?: PlacesModuleConfig;
};

/**
 * @group Viewport Places
 */
export type ViewportPlacesUpdateOptions = Omit<ViewportPlacesOptions, 'id'> & {
    /**
     * The unique identifier of the place module to update.
     * @remarks
     * * This ID must correspond to an existing place module added via an "add" method.
     */
    id: string;
};

/**
 * A class for managing dynamic searched place modules on a TomTom map.
 * It leverages the SDK search service to maintain place modules that automatically update and stay current as the map moves.
 * @group Viewport Places
 */
export class ViewportPlaces {
    /**
     * Internal map of registered place modules, keyed by their `id`.
     * @private
     */
    private registeredModules: Record<
        string,
        { options: ViewportPlacesOptions; placesModule: PlacesModule; subscription: any }
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
     * Performs the update logic for a PlacesModule with given options.
     * @param placesModule - The PlacesModule to update.
     * @param options - The options containing search parameters and zoom constraints.
     */
    private async searchAndDisplay(placesModule: PlacesModule, options: ViewportPlacesOptions): Promise<void> {
        const zoom = this.mapLibreMap.getZoom();
        if ((options.minZoom && zoom < options.minZoom) || (options.maxZoom && zoom > options.maxZoom)) {
            await placesModule.clear();
            return;
        }
        await placesModule.show(
            await search({
                boundingBox: this.map.getBBox(),
                limit: 100,
                ...options.searchOptions,
            }),
        );
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
    async add(options: ViewportPlacesOptions): Promise<PlacesModule> {
        const id = options.id ?? generateId();
        const effectiveOptions = {
            ...options,
            placesModuleConfig: { theme: 'base-map', ...options.placesModuleConfig } as PlacesModuleConfig,
        };

        const placesModule = await PlacesModule.get(this.map, effectiveOptions.placesModuleConfig);
        const searchAndDisplay = async () => {
            const entry = this.registeredModules[id];
            await this.searchAndDisplay(entry.placesModule, entry.options);
        };

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
    async addPOICategories(options: ViewportPlacesBaseOptions & { categories: POICategory[] }): Promise<PlacesModule> {
        return this.add({
            ...options,
            searchOptions: { query: '', poiCategories: options.categories },
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
    async update(newOptions: ViewportPlacesUpdateOptions): Promise<void> {
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
        await this.searchAndDisplay(entry.placesModule, entry.options);
    }
}
