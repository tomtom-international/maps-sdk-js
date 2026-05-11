import { generateId, Place, Places, POICategory, poiCategoriesToID } from '@tomtom-org/maps-sdk/core';
import { toBaseMapPOICategory, toBaseMapPOIGroup } from '../../pois/util/poiCategoryMapping';
import { DEFAULT_BASE_MAP_PLACE_ICON_ID, DEFAULT_PLACE_ICON_ID } from '../../shared/layers/symbolLayers';
import { suffixNumber } from '../../shared/layers/utils';
import { FEATURE_PROPERTY_BASE_MAP_ICON_ID } from '../layers/clusterLayers';
import type { DisplayPlaceProps } from '../types/placeDisplayProps';
import type { PlacesModuleConfig, PlacesTheme } from '../types/placesModuleConfig';
import {
    buildAvailabilityText,
    getAvailabilityRatio,
    getEVAvailabilityIconID,
    isEVStationWithAvailability,
} from './evAvailabilityHelpers';
import { toPinImageID } from './toPinImageID';

/**
 * Builds the title of the place to display it on the map.
 * @param place The place to display.
 * @ignore
 */
export const buildPlaceTitle = (place: Place): string =>
    place.properties.poi?.name ?? place.properties.address.freeformAddress;

/**
 * Resolves the image ID to use for the given POI category and icon theme.
 */
const toImageID = (poiCategory: POICategory, iconTheme: PlacesTheme, defaultPlaceIconID: string): string => {
    // `pin-clustered` uses the same per-category sprites as `pin` for individual
    // (un-clustered) features — only the cluster pin layer renders the default
    // sprite, regardless of the leaves' categories.
    if (iconTheme === 'pin' || iconTheme === 'pin-clustered') {
        const imageID = toPinImageID(poiCategoriesToID[poiCategory]);
        return imageID ?? defaultPlaceIconID;
    } else {
        const imageID = toBaseMapPOICategory(poiCategory);
        return imageID ? `poi-${imageID}` : defaultPlaceIconID;
    }
};

// When the caller hasn't registered a custom default image for this module
// instance, the `base-map` theme should fall back to a built-in micro sprite
// (small dot next to native POI labels) rather than the large `default_place`
// pin sprite used by the `pin` theme.
const resolveDefaultPlaceIconID = (config: PlacesModuleConfig, instanceIndex: number): string => {
    const hasCustomDefault = !!config.icon?.default;
    if (!hasCustomDefault && (config.theme ?? 'pin') === 'base-map') {
        return DEFAULT_BASE_MAP_PLACE_ICON_ID;
    }
    return suffixNumber(DEFAULT_PLACE_ICON_ID, instanceIndex);
};

/**
 * Gets the map style sprite image ID to display on the map for the give place.
 * @ignore
 */
export const getIconIDForPlace = (place: Place, instanceIndex: number, config: PlacesModuleConfig = {}): string => {
    const iconTheme = config.theme ?? 'pin';
    const defaultPlaceIconID = resolveDefaultPlaceIconID(config, instanceIndex);

    const imageMapping = config.icon?.mapping;
    // First, try custom mapping if provided:
    if (imageMapping) {
        if (imageMapping.to === 'imageID') {
            // Direct image ID mapping
            return imageMapping.fn(place);
        } else {
            // POI category mapping - resolve category to icon ID
            return toImageID(imageMapping.fn(place), iconTheme, defaultPlaceIconID);
        }
    }

    // Next, try to match any custom icon:
    const poiCategory = place.properties.poi?.categories?.[0] as POICategory;

    // Check for EV availability-specific icon selection
    const evAvailabilityIconID = getEVAvailabilityIconID(place, poiCategory, instanceIndex, config, iconTheme);
    if (evAvailabilityIconID) {
        return evAvailabilityIconID;
    }

    // Regular custom icon matching (no availability)
    const matchingCustomIcon = config.icon?.categoryIcons?.find((customIcon) => customIcon.id === poiCategory);
    if (matchingCustomIcon) {
        return suffixNumber(matchingCustomIcon.id, instanceIndex);
    }

    // Else: if no custom icon matched, we map to the map style icons or default:
    return toImageID(poiCategory, iconTheme, defaultPlaceIconID);
};

// When a user provides `icon.mapping.to === 'poiCategory'`, that function becomes the
// authoritative source of the place's category — the original `poi.categories[0]` may be
// missing or unrelated (e.g., user data that isn't a search-API Place). For base-map
// themes the style's `icon-image` / `text-color` expressions read `category` / `group`,
// so without honoring the mapping here those expressions resolve to `poi-` and icons
// fail to load.
const getEffectivePOICategory = (place: Place, config?: PlacesModuleConfig): POICategory | undefined => {
    const mapping = config?.icon?.mapping;
    if (mapping?.to === 'poiCategory') {
        return mapping.fn(place);
    }
    return place.properties.poi?.categories?.[0];
};

/**
 * Maps a Place category to the poi layer one, so the latter's style can apply it.
 * @ignore
 */
export const getPOILayerCategoryForPlace = (place: Place, config?: PlacesModuleConfig): string | undefined => {
    const category = getEffectivePOICategory(place, config);
    // if it's one of the different categories between search and poi layer, use poi layer category
    return category && toBaseMapPOICategory(category);
};

/**
 * Maps a Place to the base map POI group used by the style's `text-color` and
 * `POI - Micro` icon expressions (e.g., `eat_and_drink`, `lodging`, `driving`).
 * @ignore
 */
export const getPOIGroupForPlace = (place: Place, config?: PlacesModuleConfig): string | undefined => {
    const category = getEffectivePOICategory(place, config);
    return category && toBaseMapPOIGroup(category);
};

/**
 * Transforms the input of a "show" call to FeatureCollection "Places".
 * @ignore
 */
export const toPlaces = (places: Place | Place[] | Places): Places => {
    if (Array.isArray(places)) {
        return { type: 'FeatureCollection', features: places };
    }
    return places.type === 'Feature' ? { type: 'FeatureCollection', features: [places] } : places;
};

/**
 * Merges EV availability props into extraFeatureProps if enabled.
 * This makes EV stations use the same mechanism as any other custom properties.
 * @ignore
 */
const mergeEVAvailabilityProps = (
    extraFeatureProps: PlacesModuleConfig['extraFeatureProps'],
    evAvailabilityConfig: PlacesModuleConfig['evAvailability'],
    places: Places,
): PlacesModuleConfig['extraFeatureProps'] => {
    if (evAvailabilityConfig?.enabled !== true) {
        return extraFeatureProps;
    }

    // Check if any EV stations exist but lack availability data
    let hasEVStations = false;
    let hasEVStationsWithAvailability = false;

    for (const place of places.features) {
        const isEVStation = place.properties.poi?.categories?.[0] === 'ELECTRIC_VEHICLE_STATION';
        if (isEVStation) {
            hasEVStations = true;
            if (isEVStationWithAvailability(place)) {
                hasEVStationsWithAvailability = true;
                break;
            }
        }
    }

    if (hasEVStations && !hasEVStationsWithAvailability) {
        console.warn(
            'PlacesModule: evAvailability is enabled but no availability data found. ' +
                'Did you call getPlacesWithEVAvailability()?',
        );
    }

    return {
        ...extraFeatureProps,
        evAvailabilityText: (place: Place) =>
            isEVStationWithAvailability(place) ? buildAvailabilityText(place, evAvailabilityConfig) : '',
        evAvailabilityRatio: (place: Place) => (isEVStationWithAvailability(place) ? getAvailabilityRatio(place) : 0),
    };
};

// Resolves the per-leaf base-map sprite id consumed by the `pin-clustered`
// theme's cluster pin (single-category case). It's the same
// `poi-<category>` sprite the `base-map` theme renders for individual
// places, which lets the cluster icon match the surrounding base-map style
// when only one category is present. Falls back to the parking-micro
// sprite when the place has no recognisable category — same fallback the
// `base-map` theme uses for unmatched places.
const getBaseMapIconIDForPlace = (place: Place, config: PlacesModuleConfig | undefined): string => {
    const category = getPOILayerCategoryForPlace(place, config);
    return category ? `poi-${category}` : DEFAULT_BASE_MAP_PLACE_ICON_ID;
};

/**
 * prepare places features to be displayed on map by adding needed  properties for title, icon and style
 * @ignore
 */
export const preparePlacesForDisplay = (
    placesInput: Place | Place[] | Places,
    instanceIndex: number,
    config: PlacesModuleConfig = {},
): Places<DisplayPlaceProps> => {
    const places = toPlaces(placesInput);

    // Only merge EV availability props when explicitly enabled
    const mergedExtraFeatureProps =
        config.evAvailability?.enabled === true
            ? mergeEVAvailabilityProps(config.extraFeatureProps, config.evAvailability, places)
            : config.extraFeatureProps;

    return {
        ...places,
        features: places.features.map((place) => {
            const title =
                typeof config?.text?.title === 'function' ? config?.text?.title(place) : buildPlaceTitle(place);

            const extraFeatureProps = mergedExtraFeatureProps
                ? Object.fromEntries(
                      Object.entries(mergedExtraFeatureProps).map(([prop, value]) => [
                          prop,
                          typeof value === 'function' ? value(place) : value,
                      ]),
                  )
                : {};

            const id = place.id ?? generateId();

            return {
                ...place,
                id,
                geometry: { ...place.geometry, bbox: place.bbox },
                properties: {
                    ...place.properties,
                    id, // we need id in properties due to promoteId feature
                    title,
                    iconID: getIconIDForPlace(place, instanceIndex, config),
                    // The base-map style's POI / POI - Micro layer expressions key off
                    // `category` and `group` for icon-image and text-color. Both the
                    // `base-map` theme and the `pin-clustered` theme's micro layer
                    // (registered for un-clustered singletons) reuse those expressions,
                    // so the leaf needs `category`/`group` populated under either theme.
                    ...((config?.theme === 'base-map' || config?.theme === 'pin-clustered') && {
                        category: getPOILayerCategoryForPlace(place, config),
                        group: getPOIGroupForPlace(place, config),
                    }),
                    // For the `pin-clustered` theme we promote the per-place
                    // base-map sprite ID to a top-level feature property so the
                    // source's `clusterProperties` aggregator can read it via
                    // `['get', ...]` from each leaf feature. `baseMapIconID`
                    // resolves to a `poi-<category>` sprite and feeds the cluster pin's
                    // single-vs-mixed `match` expression.
                    ...(config?.theme === 'pin-clustered' && {
                        [FEATURE_PROPERTY_BASE_MAP_ICON_ID]: getBaseMapIconIDForPlace(place, config),
                    }),
                    ...extraFeatureProps,
                },
            };
        }),
    };
};
