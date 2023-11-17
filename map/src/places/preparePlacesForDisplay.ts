import { Map } from "maplibre-gl";
import { Place, Places, POICategory } from "@anw/maps-sdk-js/core";
import { DisplayPlaceProps } from "./types/placeDisplayProps";
import { CustomIcon, PlacesModuleConfig } from "./types/placesModuleConfig";
import { MapStylePOICategory, toMapDisplayPOICategory } from "../pois/poiCategoryMapping";

/**
 * Builds the title of the place to display it on the map.
 * @param place The place to display.
 */
export const buildPlaceTitle = (place: Place): string =>
    place.properties.poi?.name || place.properties.address.freeformAddress;

/**
 * @ignore
 */
export const addMapIcon = (map: Map, classificationCode: MapStylePOICategory, customIcon: CustomIcon) => {
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
export const getIconIDForPlace = (place: Place, config: PlacesModuleConfig = {}, map?: Map): string => {
    const { iconConfig } = config;
    const iconStyle = iconConfig?.iconStyle || "pin";
    const classificationCode = place.properties.poi?.classifications?.[0]?.code as MapStylePOICategory;

    // TODO: wait for pin support in Orbis
    const iconID = (classificationCode && `poi-${toMapDisplayPOICategory(classificationCode)}`) || "default_pin";
    // const effectiveIconID = iconStyle === "pin" ? `${iconID}_pin` : iconID;
    const effectiveIconID = iconStyle === "pin" ? iconID : iconID;

    if (!iconConfig?.customIcons || !map) {
        return effectiveIconID;
    }

    for (const customIcon of iconConfig.customIcons) {
        if (customIcon.category == classificationCode) {
            addMapIcon(map, classificationCode, customIcon);
            return classificationCode.toLowerCase();
        }
    }

    return effectiveIconID;
};

/**
 * Maps a Place category to the poi layer one, so the latter's style can apply it.
 * @ignore
 */
export const getPOILayerCategoryForPlace = (place: Place): string | undefined => {
    const category = place.properties.poi?.classifications?.[0]?.code;
    // if it's one of the different categories between search and poi layer, use poi layer category
    return category && toMapDisplayPOICategory(category as POICategory);
};

/**
 * Transforms the input of a "show" call to FeatureCollection "Places".
 * @ignore
 */
export const toPlaces = (places: Place | Place[] | Places): Places => {
    if (Array.isArray(places)) {
        return { type: "FeatureCollection", features: places };
    }
    return places.type == "Feature" ? { type: "FeatureCollection", features: [places] } : places;
};

/**
 * prepare places features to be displayed on map by adding needed  properties for title, icon and style
 * @ignore
 */
export const preparePlacesForDisplay = (
    placesInput: Place | Place[] | Places,
    map: Map,
    config: PlacesModuleConfig = {}
): Places<DisplayPlaceProps> => {
    const places = toPlaces(placesInput);
    return {
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
                    ...(config?.iconConfig?.iconStyle == "poi-like" && {
                        category: getPOILayerCategoryForPlace(place)
                    }),
                    ...extraFeatureProps
                }
            };
        })
    };
};
