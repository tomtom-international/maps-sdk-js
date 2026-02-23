import type { MapStylePOICategory } from '../../places';
import type { MapModuleCommonConfig, ValuesFilter } from '../../shared';
import type { POICategoryGroup } from './poiCategoryGroups';

/**
 * A POI classification or group that can be filtered.
 *
 * Can be either a specific POI category (like RESTAURANT, HOTEL_MOTEL) or a
 * broader category group (like FOOD_DRINKS_GROUP, SHOPPING_GROUP) that contains
 * multiple related categories.
 *
 * @remarks
 * **Category vs Group:**
 * - Category: Specific POI type (e.g., RESTAURANT, GAS_STATION)
 * - Group: Collection of related categories (e.g., FOOD_DRINKS_GROUP includes restaurants, cafes, bars)
 *
 * Using groups is more convenient when you want to filter multiple related categories at once.
 *
 * @example
 * ```typescript
 * // Individual category
 * const category: FilterablePOICategory = 'RESTAURANT';
 *
 * // Category group
 * const group: FilterablePOICategory = 'FOOD_DRINKS_GROUP';
 *
 * // Mix of both
 * const categories: FilterablePOICategory[] = ['RESTAURANT', 'SHOPPING_GROUP'];
 * ```
 *
 * @group POIs
 */
export type FilterablePOICategory = MapStylePOICategory | POICategoryGroup;

/**
 * Configuration options for the POIsModule.
 *
 * Controls visibility and filtering of Points of Interest displayed in the map style.
 *
 * @remarks
 * POIs are part of the base map vector tiles and include businesses, landmarks,
 * and other points of interest. This configuration allows you to control which
 * categories are visible.
 *
 * @example
 * ```typescript
 * // Show only restaurants
 * const config: POIsModuleConfig = {
 *   visible: true,
 *   filters: {
 *     categories: {
 *       show: 'only',
 *       values: ['RESTAURANT']
 *     }
 *   }
 * };
 *
 * // Hide parking-related POIs
 * const noParkingConfig: POIsModuleConfig = {
 *   filters: {
 *     categories: {
 *       show: 'all_except',
 *       values: ['PARKING_GROUP']
 *     }
 *   }
 * };
 *
 * // Show only food and shopping
 * const limitedConfig: POIsModuleConfig = {
 *   filters: {
 *     categories: {
 *       show: 'only',
 *       values: ['FOOD_DRINKS_GROUP', 'SHOPPING_GROUP']
 *     }
 *   }
 * };
 * ```
 *
 * @group POIs
 */
export type POIsModuleConfig = MapModuleCommonConfig & {
    /**
     * Controls the visibility of the POI layers.
     *
     * @default true
     */
    visible?: boolean;

    /**
     * Optional filters for controlling which POI categories are displayed.
     *
     * @remarks
     * If omitted, all POI categories are displayed by default.
     */
    filters?: {
        /**
         * Category filter configuration.
         *
         * @remarks
         * By default, all categories are included in the map.
         * - Use `all_except` show mode to hide some categories/groups
         * - Use `only` mode to show only specific categories/groups and hide everything else
         *
         * @example
         * ```typescript
         * // Show only restaurants and hotels
         * categories: {
         *   show: 'only',
         *   values: ['RESTAURANT', 'HOTEL_MOTEL']
         * }
         *
         * // Hide parking
         * categories: {
         *   show: 'all_except',
         *   values: ['PARKING_GARAGE', 'OPEN_PARKING_AREA']
         * }
         *
         * // Show only food-related POIs
         * categories: {
         *   show: 'only',
         *   values: ['FOOD_DRINKS_GROUP']
         * }
         * ```
         */
        categories: ValuesFilter<FilterablePOICategory>;
    };
};
