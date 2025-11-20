import { Place } from '@tomtom-org/maps-sdk/core';

// Supported sub-categories for map display pins
// See: https://github.com/tomtom-international/mdt-backend-mapbox-gl-js-styles/blob/orbis-preview/src/orbis/sprites/poi_light/config.json
// For the rest we'll use the main categories (which are the first 4 digits of a category)
const supportedPinSubcategories: Set<number> = new Set([
    7339002, 8099002, 7369004, 7321003, 7376006, 9362003, 9362004, 9160004, 9376007, 7315015, 9376006, 9376002, 7315078,
    7315149, 9376005, 7372003, 9352045, 9352032, 9361048, 9902003, 9378005, 7383004, 9910004, 7320002, 9362016, 7320003,
    9362025, 9942002, 9942003, 7380005, 9663003, 9361021, 9379009, 9379004, 7315147, 9376003, 9160002, 9160003, 9352008,
    9361006, 7389004, 9910006,
]);

/**
 * Maps a place to the ID of the map style sprite image to use as pin for it.
 * NOTE: this is likely to evolve in the future as Orbis APIs mature and stop relying on Genesis categories.
 * @see https://github.com/tomtom-international/mdt-backend-mapbox-gl-js-styles/blob/orbis-preview/src/orbis/sprites/poi_light/config.json
 * @ignore
 */
export const toMapDisplayPin = (place: Place, defaultPlaceIconID: string): string => {
    const categoryID = place.properties.poi?.categoryIds?.[0];
    if (!categoryID) {
        return defaultPlaceIconID;
    }

    // Check if the category ID is in our supported subcategories:
    if (supportedPinSubcategories.has(categoryID)) {
        return categoryID.toString();
    }

    // If not, fall back to the main category (first 4 digits of the category ID):
    return categoryID.toString().substring(0, 4);
};
