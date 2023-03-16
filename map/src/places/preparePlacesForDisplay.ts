import { Map } from "maplibre-gl";
import { Place, Places } from "@anw/go-sdk-js/core";
import { DisplayPlaceProps } from "./types/PlaceDisplayProps";
import { CustomIcon, PlaceModuleConfig } from "./types/PlaceModuleConfig";
import {
    MapStylePOIClassification,
    placeToPOILayerClassificationMapping,
    poiClassificationToIconID
} from "./poiIconIDMapping";

/**
 * Builds the title of the place to display it on the map.
 * @param place The place to display.
 */
export const buildPlaceTitle = (place: Place): string =>
    place.properties.poi?.name || place.properties.address.freeformAddress;

/**
 * @ignore
 */
export const addMapIcon = (map: Map, classificationCode: MapStylePOIClassification, customIcon: CustomIcon) => {
    map.loadImage(customIcon.iconUrl, (e, image) => {
        if (e) {
            throw e;
        }

        if (map.hasImage(classificationCode.toLowerCase())) {
            return;
        }
        image && map.addImage(classificationCode.toLowerCase(), image);
    });
};

/**
 * Gets the map style sprite image ID to display on the map for the give place.
 * @param place The place to display.
 * @param map
 * @param config
 */
export const getIconIDForPlace = (place: Place, config: PlaceModuleConfig = {}, map?: Map): string => {
    const { iconConfig } = config;
    const iconStyle = iconConfig?.iconStyle || "pin";
    const classificationCode = place.properties.poi?.classifications?.[0]?.code as MapStylePOIClassification;
    const iconID = (classificationCode && poiClassificationToIconID[classificationCode]?.toString()) || "default";
    const defaultIcon = iconStyle === "pin" ? `${iconID}_pin` : iconID;

    if (!iconConfig?.customIcons || !map) {
        return defaultIcon;
    }

    for (const customIcon of iconConfig.customIcons) {
        if (customIcon.category == classificationCode) {
            addMapIcon(map, classificationCode, customIcon);
            return classificationCode.toLowerCase();
        }
    }

    return defaultIcon;
};

/**
 * Maps a Place category to the poi layer one, so the latter's style can apply it.
 * @ignore
 */
export const getPOILayerCategoryForPlace = (place: Place): string | undefined => {
    const category = place.properties.poi?.classifications?.[0]?.code;
    // if it's one of the different categories between search and poi layer, use poi layer category
    return (
        category &&
        (category in placeToPOILayerClassificationMapping
            ? placeToPOILayerClassificationMapping[category as MapStylePOIClassification]
            : category.toLowerCase())
    );
};

/**
 * prepare places features to be displayed on map by adding needed  properties for title, icon and style
 * @ignore
 * @param places
 * @param map
 * @param config
 */
export const preparePlacesForDisplay = (
    places: Places,
    map: Map,
    config: PlaceModuleConfig = {}
): Places<DisplayPlaceProps> => ({
    ...places,
    features: places.features.map((place) => {
        const title =
            typeof config?.textConfig?.textField === "function"
                ? config?.textConfig?.textField(place)
                : buildPlaceTitle(place);

        const extraFeatureProps = config.extraFeatureProps
            ? Object.keys(config.extraFeatureProps).reduce(
                  (acc, prop) => ({
                      ...acc,
                      [prop]:
                          typeof config.extraFeatureProps?.[prop] === "function"
                              ? config.extraFeatureProps?.[prop](place)
                              : config.extraFeatureProps?.[prop]
                  }),
                  {}
              )
            : {};
        return {
            ...place,
            geometry: {
                ...place.geometry,
                bbox: place.bbox
            },
            properties: {
                ...place.properties,
                id: place.id,
                title,
                iconID: getIconIDForPlace(place, config, map),
                ...(config?.iconConfig?.iconStyle == "poi-like" && { category: getPOILayerCategoryForPlace(place) }),
                ...extraFeatureProps
            }
        };
    })
});
