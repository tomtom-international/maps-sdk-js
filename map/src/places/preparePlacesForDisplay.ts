import type { Place, Places } from '@tomtom-org/maps-sdk/core';
import type { Map } from 'maplibre-gl';
import type { MapStylePOICategory } from '../pois/poiCategoryMapping';
import { toMapDisplayPOICategory } from '../pois/poiCategoryMapping';
import { toMapDisplayPin } from './pinCategoryMapping';
import type { DisplayPlaceProps } from './types/placeDisplayProps';
import type { PlacesModuleConfig } from './types/placesModuleConfig';

/**
 * Builds the title of the place to display it on the map.
 * @param place The place to display.
 */
export const buildPlaceTitle = (place: Place): string =>
    place.properties.poi?.name ?? place.properties.address.freeformAddress;

/**
 * Gets the map style sprite image ID to display on the map for the give place.
 * @param place The place to display.
 * @param map
 * @param config
 */
export const getIconIDForPlace = (place: Place, config: PlacesModuleConfig = {}, map?: Map): string => {
    const iconStyle = config.iconConfig?.iconStyle ?? 'pin';
    const customIcons = config.iconConfig?.customIcons;

    // First we try to match any custom icon:
    const classificationCode = place.properties.poi?.classifications?.[0]?.code as MapStylePOICategory;
    const matchingCustomIcon = customIcons?.find((customIcon) => customIcon.id === classificationCode);
    if (matchingCustomIcon) {
        return matchingCustomIcon.id;
    }
    // Else: if no custom icon matched, we map to the map style icons:

    let iconId: string;
    if (iconStyle === 'pin') {
        iconId = toMapDisplayPin(place);
    } else {
        // POI assets have their own category mapping and we use search classification codes to map them:
        // TODO: consider default_circle asset instead of default_pin
        iconId = (classificationCode && `poi-${toMapDisplayPOICategory(classificationCode)}`) ?? 'default_pin';
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
    map: Map,
    config: PlacesModuleConfig = {},
): Places<DisplayPlaceProps> => {
    const places = toPlaces(placesInput);
    return {
        ...places,
        features: places.features.map((place) => {
            const title =
                typeof config?.textConfig?.textField === 'function'
                    ? config?.textConfig?.textField(place)
                    : buildPlaceTitle(place);

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
                geometry: {
                    ...place.geometry,
                    bbox: place.bbox,
                },
                properties: {
                    ...place.properties,
                    id: place.id,
                    title,
                    iconID: getIconIDForPlace(place, config, map),
                    ...(config?.iconConfig?.iconStyle === 'poi-like' && {
                        category: getPOILayerCategoryForPlace(place),
                    }),
                    ...extraFeatureProps,
                },
            };
        }),
    };
};
