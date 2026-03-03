import type { Feature, Point } from 'geojson';

/**
 * A GeoJSON feature representing a POI from the vector tile map.
 *
 * Contains properties specific to Points of Interest including unique identifiers,
 * names, categories, and styling information.
 *
 * @remarks
 * These features are returned when interacting with POI layers through events
 * (click, hover, etc.) on the POIsModule.
 *
 * @example
 * ```typescript
 * poisModule.events.on('click', (feature: POIsModuleFeature) => {
 *   console.log('POI Name:', feature.properties.name);
 *   console.log('Category:', feature.properties.category);
 *   console.log('POI ID:', feature.properties.id);
 * });
 * ```
 *
 * @group POIs
 * @see https://docs.tomtom.com/map-display-api/documentation/tomtom-orbis-maps/vector/content#poi for more details on the available properties from the vector tile features
 */
export type POIsModuleFeature = Feature<
    Point,
    {
        /**
         * A unique Point of Interest identifier.
         *
         * @remarks
         * This ID can be used across other TomTom services to fetch additional
         * information about the POI (e.g., via Place by ID service).
         *
         * @example '528009002822995'
         */
        id: string;

        /**
         * Feature name in the native language.
         *
         * @remarks
         * Displayed in NGT (Neutral Ground Truth) language, which is the native
         * language of each country respectively.
         *
         * @example 'Starbucks'
         */
        name: string;

        /**
         * POI category identifier.
         *
         * @remarks
         * Used for styling and filtering purposes. Maps to a specific POI type
         * (e.g., RESTAURANT, HOTEL_MOTEL).
         *
         * @example 'restaurant'
         */
        category: string;

        /**
         * Broad category group this POI belongs to.
         *
         * @remarks
         * Groups similar categories together for easier filtering and styling
         * (e.g., 'Food & Drink', 'Shopping', 'Transportation').
         *
         * @example 'Food & Drink'
         */
        group: string;

        /**
         * Display priority of the POI.
         *
         * @remarks
         * Lower values indicate higher importance. Used by the map renderer to
         * determine which POIs to show when space is limited.
         *
         * @example 1 // High priority, 10 // Low priority
         */
        priority: number;
    }
>;
