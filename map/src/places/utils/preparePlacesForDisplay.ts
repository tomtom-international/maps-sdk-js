import { generateId, Place, Places, POICategory } from '@tomtom-org/maps-sdk/core';
import { toMapDisplayPOICategory } from '../../pois/poiCategoryMapping';
import { DEFAULT_PLACE_ICON_ID } from '../../shared/layers/symbolLayers';
import { suffixNumber } from '../../shared/layers/utils';
import type { DisplayPlaceProps } from '../types/placeDisplayProps';
import type { PlacesModuleConfig } from '../types/placesModuleConfig';
import { toMapDisplayPin } from './pinCategoryStandardMapping';

/**
 * Builds the title of the place to display it on the map.
 * @param place The place to display.
 * @ignore
 */
export const buildPlaceTitle = (place: Place): string =>
    place.properties.poi?.name ?? place.properties.address.freeformAddress;

/**
 * Gets the map style sprite image ID to display on the map for the give place.
 * @ignore
 */
export const getIconIDForPlace = (place: Place, instanceIndex: number, config: PlacesModuleConfig = {}): string => {
    const iconTheme = config.theme ?? 'pin';
    // TODO: perhaps all the available icon mappings should come resolved from PlacesModule instance
    const categoryIcons = config.icon?.categoryIcons;

    // First we try to match any custom icon:
    const classificationCode = place.properties.poi?.classifications?.[0]?.code as POICategory;
    const matchingCustomIcon = categoryIcons?.find((customIcon) => customIcon.id === classificationCode);
    if (matchingCustomIcon) {
        return suffixNumber(matchingCustomIcon.id, instanceIndex);
    }
    // Else: if no custom icon matched, we map to the map style icons:

    const defaultPlaceIconID = suffixNumber(DEFAULT_PLACE_ICON_ID, instanceIndex);
    let iconId: string;
    if (iconTheme === 'pin') {
        iconId = toMapDisplayPin(place, defaultPlaceIconID);
    } else {
        // POI assets have their own category mapping and we use search classification codes to map them:
        // TODO: consider default_circle asset instead of default_pin
        iconId = (classificationCode && `poi-${toMapDisplayPOICategory(classificationCode)}`) ?? defaultPlaceIconID;
    }

    return iconId;
};

/**
 * Maps a Place category to the poi layer one, so the latter's style can apply it.
 * @ignore
 */
export const getPOILayerCategoryForPlace = (place: Place): string | undefined => {
    const category = place.properties.poi?.classifications?.[0]?.code;
    // if it's one of the different categories between search and poi layer, use poi layer category
    return category && toMapDisplayPOICategory(category);
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
 * prepare places features to be displayed on map by adding needed  properties for title, icon and style
 * @ignore
 */
export const preparePlacesForDisplay = (
    placesInput: Place | Place[] | Places,
    instanceIndex: number,
    config: PlacesModuleConfig = {},
): Places<DisplayPlaceProps> => {
    const places = toPlaces(placesInput);
    return {
        ...places,
        features: places.features.map((place) => {
            const title =
                typeof config?.text?.title === 'function' ? config?.text?.title(place) : buildPlaceTitle(place);

            const extraFeatureProps = config.extraFeatureProps
                ? Object.fromEntries(
                      Object.entries(config.extraFeatureProps).map(([prop, value]) => [
                          prop,
                          typeof value === 'function' ? value(place) : value,
                      ]),
                  )
                : {};

            return {
                ...place,
                geometry: { ...place.geometry, bbox: place.bbox },
                properties: {
                    ...place.properties,
                    id: place.id ?? generateId(),
                    title,
                    iconID: getIconIDForPlace(place, instanceIndex, config),
                    ...(config?.theme === 'base-map' && { category: getPOILayerCategoryForPlace(place) }),
                    ...extraFeatureProps,
                },
            };
        }),
    };
};
