import { generateId, Place, Places, POICategory, poiCategoriesToID } from '@tomtom-org/maps-sdk/core';
import { toBaseMapPOICategory } from '../../pois/poiCategoryMapping';
import { DEFAULT_PLACE_ICON_ID } from '../../shared/layers/symbolLayers';
import { suffixNumber } from '../../shared/layers/utils';
import type { DisplayPlaceProps } from '../types/placeDisplayProps';
import type { PlacesModuleConfig, PlacesTheme } from '../types/placesModuleConfig';
import {
    buildAvailabilityRatio,
    buildAvailabilityText,
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
    if (iconTheme === 'pin') {
        const imageID = toPinImageID(poiCategoriesToID[poiCategory]);
        return imageID ?? defaultPlaceIconID;
    } else {
        const imageID = toBaseMapPOICategory(poiCategory);
        return imageID ? `poi-${imageID}` : defaultPlaceIconID;
    }
};

/**
 * Gets the map style sprite image ID to display on the map for the give place.
 * @ignore
 */
export const getIconIDForPlace = (place: Place, instanceIndex: number, config: PlacesModuleConfig = {}): string => {
    const iconTheme = config.theme ?? 'pin';
    const defaultPlaceIconID = suffixNumber(DEFAULT_PLACE_ICON_ID, instanceIndex);

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
    const poiCategory = place.properties.poi?.classifications?.[0]?.code as POICategory;
    const matchingCustomIcon = config.icon?.categoryIcons?.find((customIcon) => customIcon.id === poiCategory);
    if (matchingCustomIcon) {
        return suffixNumber(matchingCustomIcon.id, instanceIndex);
    }
    // Else: if no custom icon matched, we map to the map style icons:
    return toImageID(poiCategory, iconTheme, defaultPlaceIconID);
};

/**
 * Maps a Place category to the poi layer one, so the latter's style can apply it.
 * @ignore
 */
export const getPOILayerCategoryForPlace = (place: Place): string | undefined => {
    const category = place.properties.poi?.classifications?.[0]?.code;
    // if it's one of the different categories between search and poi layer, use poi layer category
    return category && toBaseMapPOICategory(category);
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
    // Only merge if explicitly enabled (opt-in)
    if (evAvailabilityConfig?.enabled !== true) {
        return extraFeatureProps;
    }

    // Check if any EV stations exist but lack availability data (single pass for performance)
    let hasEVStations = false;
    let hasEVStationsWithAvailability = false;
    
    for (const place of places.features) {
        const isEVStation = place.properties.poi?.classifications?.[0]?.code === 'ELECTRIC_VEHICLE_STATION';
        if (isEVStation) {
            hasEVStations = true;
            if (isEVStationWithAvailability(place)) {
                hasEVStationsWithAvailability = true;
                break; // Found what we need, stop checking
            }
        }
    }

    if (hasEVStations && !hasEVStationsWithAvailability) {
        console.warn(
            'PlacesModule: evAvailability is enabled but no availability data found. ' +
                'Did you call getPlacesWithEVAvailability() before passing the data to show()?',
        );
    }

    // Merge EV availability functions into extraFeatureProps
    return {
        ...extraFeatureProps,
        // Only compute these for EV stations with availability data
        evAvailabilityText: (place: Place) =>
            isEVStationWithAvailability(place) ? buildAvailabilityText(place, evAvailabilityConfig) : '',
        evAvailabilityRatio: (place: Place) => (isEVStationWithAvailability(place) ? buildAvailabilityRatio(place) : 0),
    };
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

    // Merge EV availability into extraFeatureProps so all places are treated uniformly
    const mergedExtraFeatureProps = mergeEVAvailabilityProps(config.extraFeatureProps, config.evAvailability, places);

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
                    ...(config?.theme === 'base-map' && { category: getPOILayerCategoryForPlace(place) }),
                    ...extraFeatureProps,
                },
            };
        }),
    };
};
