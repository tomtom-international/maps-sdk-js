import { POICategory } from '@tomtom-org/maps-sdk/core';
import { isNil } from 'lodash-es';
import type { FilterSpecification } from 'maplibre-gl';
import { toBaseMapPOICategory } from '../places';
import type { ValuesFilter } from '../shared';
import { AbstractMapModule, EventsModule, POI_SOURCE_ID, StyleSourceWithLayers } from '../shared';
import { notInTheStyle } from '../shared/errorMessages';
import { buildMappedValuesFilter, getMergedAllFilter } from '../shared/mapLibreFilterUtils';
import { waitUntilMapIsReady } from '../shared/mapUtils';
import type { TomTomMap } from '../TomTomMap';
import { poiLayerIDs } from './layers/poisLayers';
import { poiCategoryGroups } from './poiCategoryGroups';
import type { FilterablePOICategory, POIsModuleConfig, POIsModuleFeature } from './types/poisModuleConfig';

/**
 * Gets the specified filtered categories icon IDs to be used in map filtering.
 * @param categories list of filtered categories.
 * @ignore
 */
export const getStyleCategories = (categories: FilterablePOICategory[]): string[] => {
    const categoryIds: string[] = [];
    categories.forEach((category: FilterablePOICategory) => {
        if (category in poiCategoryGroups) {
            categoryIds.push(...poiCategoryGroups[category].map(toBaseMapPOICategory));
        } else {
            categoryIds.push(toBaseMapPOICategory(category as POICategory));
        }
    });
    return [...new Set(categoryIds)];
};

/**
 * IDs of sources and layers for places of interest module.
 */
type PoIsSourcesAndLayers = {
    /**
     * Places of interest with corresponding layer ids.
     * TODO: technically source ID is vectorTiles if POIs stay included in base map for Orbis
     */
    poi: StyleSourceWithLayers;
};

/**
 * POIs Module for controlling Points of Interest displayed in the map style.
 *
 * This module manages the built-in POI layer from the vector map, allowing you to
 * show/hide POIs and filter them by category. POIs are already part of the map style
 * and include businesses, landmarks, and other points of interest.
 *
 * @remarks
 * **Features:**
 * - Toggle POI visibility on/off
 * - Filter by POI categories or category groups
 * - Event handling for POI interactions
 * - Based on vector tile data in the map style
 *
 * **POI Categories:**
 * - Individual categories (e.g., RESTAURANT, HOTEL_MOTEL, PARKING_GARAGE)
 * - Category groups (e.g., FOOD_DRINKS_GROUP, SHOPPING_GROUP, TRANSPORTATION_GROUP)
 *
 * **Difference from PlacesModule:**
 * - POIsModule: Controls existing POIs in the map style
 * - PlacesModule: Displays custom place data from Search API or other sources
 *
 * @example
 * Basic usage:
 * ```typescript
 * import { POIsModule } from '@tomtom-international/maps-sdk-js/map';
 *
 * // Get module
 * const pois = await POIsModule.get(map);
 *
 * // Toggle visibility
 * pois.setVisible(false);
 * pois.setVisible(true);
 * ```
 *
 * @example
 * Filter specific categories:
 * ```typescript
 * // Show only restaurants and hotels
 * pois.filterCategories({
 *   show: 'only',
 *   values: ['RESTAURANT', 'HOTEL_MOTEL']
 * });
 *
 * // Hide parking garages
 * pois.filterCategories({
 *   show: 'all_except',
 *   values: ['PARKING_GARAGE', 'OPEN_PARKING_AREA']
 * });
 * ```
 *
 * @example
 * Filter using category groups:
 * ```typescript
 * // Show only food and shopping POIs
 * pois.filterCategories({
 *   show: 'only',
 *   values: ['FOOD_DRINKS_GROUP', 'SHOPPING_GROUP']
 * });
 *
 * // Hide transportation POIs
 * pois.filterCategories({
 *   show: 'all_except',
 *   values: ['TRANSPORTATION_GROUP']
 * });
 * ```
 *
 * @example
 * Event handling:
 * ```typescript
 * pois.events.on('click', (feature, lngLat) => {
 *   console.log('Clicked POI:', feature.properties.name);
 *   console.log('Category:', feature.properties.category);
 * });
 * ```
 *
 * @see [POIs Guide](https://docs.tomtom.com/maps-sdk-js/guides/map/pois)
 *
 * @group POIs
 */
export class POIsModule extends AbstractMapModule<PoIsSourcesAndLayers, POIsModuleConfig> {
    private categoriesFilter?: ValuesFilter<FilterablePOICategory> | null;
    private originalFilter?: FilterSpecification;

    /**
     * Retrieves a POIsModule instance for the given map.
     *
     * @param map - The TomTomMap instance to attach this module to.
     * @param config - Optional initial configuration for visibility and filters.
     *
     * @returns A promise that resolves to the initialized POIsModule.
     *
     * @remarks
     * **Configuration:**
     * - `visible`: Initial visibility state
     * - `filters.categories`: Category filter to apply on initialization
     *
     * @throws Error if the POI source is not found in the map style
     *
     * @example
     * Default initialization:
     * ```typescript
     * const pois = await POIsModule.get(map);
     * ```
     *
     * @example
     * With initial filter:
     * ```typescript
     * const pois = await POIsModule.get(map, {
     *   visible: true,
     *   filters: {
     *     categories: {
     *       show: 'only',
     *       values: ['RESTAURANT', 'CAFE_PUB']
     *     }
     *   }
     * });
     * ```
     */
    static async get(map: TomTomMap, config?: POIsModuleConfig): Promise<POIsModule> {
        await waitUntilMapIsReady(map);
        return new POIsModule(map, config);
    }

    private constructor(map: TomTomMap, config?: POIsModuleConfig) {
        super('style', map, config);
    }

    /**
     * @ignore
     */
    protected _initSourcesWithLayers() {
        const poiRuntimeSource = this.mapLibreMap.getSource(POI_SOURCE_ID);
        if (!poiRuntimeSource) {
            throw notInTheStyle(`init ${POIsModule.name} with source ID ${POI_SOURCE_ID}`);
        }
        const poi = new StyleSourceWithLayers(this.mapLibreMap, poiRuntimeSource, (layer) =>
            poiLayerIDs.includes(layer.id),
        );
        // TODO: check if the layers are present in the style, and if not, throw exception?
        const mainLayer = poi.sourceAndLayerIDs.layerIDs[0];
        if (this.mapLibreMap.getLayer(mainLayer)) {
            this.originalFilter = this.mapLibreMap.getFilter(mainLayer) as FilterSpecification;
        }
        return { poi };
    }

    /**
     * @ignore
     */
    protected _applyConfig(config: POIsModuleConfig | undefined) {
        if (config && !isNil(config.visible)) {
            this.setVisible(config.visible);
        } else if (!this._initializing && !this.isVisible()) {
            // applying default:
            this.setVisible(true);
        }

        this.filterCategories(config?.filters?.categories);
        return config;
    }

    /**
     * Checks if POI layers are currently visible.
     *
     * @returns `true` if at least one POI layer is visible, `false` if all are hidden.
     *
     * @example
     * ```typescript
     * if (pois.isVisible()) {
     *   console.log('POIs are displayed');
     * }
     * ```
     */
    isVisible(): boolean {
        return this.sourcesWithLayers.poi.isAnyLayerVisible();
    }

    /**
     * Sets the visibility of POI layers.
     *
     * @param visible - `true` to show POIs, `false` to hide them.
     *
     * @remarks
     * Changes are applied immediately if the map is ready.
     *
     * @example
     * ```typescript
     * pois.setVisible(false); // Hide all POIs
     * pois.setVisible(true);  // Show all POIs
     * ```
     */
    setVisible(visible: boolean): void {
        this.config = {
            ...this.config,
            visible,
        };

        if (this.tomtomMap.mapReady) {
            this.sourcesWithLayers.poi.setLayersVisible(visible);
        }
    }

    /**
     * Filters POIs by category or category group.
     *
     * @param categoriesFilter - Filter configuration specifying which categories to show/hide.
     * Pass `undefined` to reset to default (show all).
     *
     * @remarks
     * **Filter Modes:**
     * - `only`: Show only the specified categories, hide all others
     * - `all_except`: Show all categories except the specified ones
     *
     * **Category Types:**
     * - Individual categories (e.g., 'RESTAURANT', 'HOTEL_MOTEL')
     * - Category groups (e.g., 'FOOD_DRINKS_GROUP', 'SHOPPING_GROUP')
     *
     * **Available Category Groups:**
     * - FOOD_DRINKS_GROUP
     * - SHOPPING_GROUP
     * - TRANSPORTATION_GROUP
     * - HEALTH_GROUP
     * - PARKING_GROUP
     * - HOLIDAY_TOURISM_GROUP
     * - EV_CHARGING_STATIONS_GROUP
     * - GAS_STATIONS_GROUP
     * - ACCOMMODATION_GROUP
     * - ENTERTAINMENT_GROUP
     * - SPORTS_LEISURE_GROUP
     * - EDUCATION_GROUP
     * - GOVERNMENT_GROUP
     *
     * @example
     * Show only restaurants:
     * ```typescript
     * pois.filterCategories({
     *   show: 'only',
     *   values: ['RESTAURANT']
     * });
     * ```
     *
     * @example
     * Hide parking:
     * ```typescript
     * pois.filterCategories({
     *   show: 'all_except',
     *   values: ['PARKING_GROUP']
     * });
     * ```
     *
     * @example
     * Reset filter (show all):
     * ```typescript
     * pois.filterCategories(undefined);
     * ```
     */
    filterCategories(categoriesFilter?: ValuesFilter<FilterablePOICategory> | undefined): void {
        if (categoriesFilter) {
            if (this.tomtomMap.mapReady) {
                const poiFilter = buildMappedValuesFilter(
                    'category',
                    categoriesFilter.show,
                    getStyleCategories(categoriesFilter.values),
                );

                this.mapLibreMap.setFilter('POI', getMergedAllFilter(poiFilter, this.originalFilter));
            }
            this.config = {
                ...this.config,
                filters: {
                    categories: categoriesFilter,
                },
            };
        } else if (this.categoriesFilter) {
            // reset categories config to default
            this.config = {
                ...this.config,
                filters: {
                    categories: {
                        show: 'all_except',
                        values: [],
                    },
                },
            };
            if (this.tomtomMap.mapReady) {
                // Applies default:
                this.mapLibreMap.setFilter('POI', this.originalFilter);
            }
        }

        this.categoriesFilter = categoriesFilter;
    }

    /**
     * Gets the events interface for handling user interactions with POIs.
     *
     * @returns An EventsModule instance for registering event handlers.
     *
     * @remarks
     * **Supported Events:**
     * - `click`: User clicks on a POI
     * - `contextmenu`: User right-clicks on a POI
     * - `hover`: Mouse enters a POI
     * - `long-hover`: Mouse hovers over POI for extended time
     *
     * **Event Feature Properties:**
     * - `id`: Unique POI identifier
     * - `name`: POI name in native language
     * - `category`: POI category
     * - `iconID`: Icon sprite ID
     * - `group`: Category group
     * - `priority`: Importance level (lower = more important)
     *
     * @example
     * ```typescript
     * pois.events.on('click', (feature, lngLat) => {
     *   console.log('POI:', feature.properties.name);
     *   console.log('Category:', feature.properties.category);
     *   console.log('ID:', feature.properties.id);
     * });
     *
     * pois.events.on('hover', (feature) => {
     *   showTooltip(feature.properties.name);
     * });
     * ```
     */
    get events() {
        return new EventsModule<POIsModuleFeature>(this.tomtomMap._eventsProxy, this.sourcesWithLayers.poi);
    }
}
