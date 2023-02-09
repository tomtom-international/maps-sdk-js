import { DataDrivenPropertyValueSpecification, Map, SymbolLayerSpecification } from "maplibre-gl";
import { Place, Places, CommonPlaceProps } from "@anw/go-sdk-js/core";
import { ICON_ID, PlaceDisplayProps, TITLE } from "./types/PlaceDisplayProps";
import { CustomIcon, PlaceIconConfig, PlaceModuleConfig } from "./types/PlaceModuleConfig";
import { placesLayerSpec } from "./layers/PlacesLayers";
import { LayerSpecWithSource } from "../core";
import {
    POIClassification,
    poiClassificationToIconID,
    searchToPOILayerClassificationMapping
} from "./poiIconIDMapping";

const placesLayerID = "placesSymbols";
/**
 * Builds the title of the place to display it on the map.
 * @param place The place to display.
 * @group MapPlaces
 * @category Functions
 */
export const buildPlaceTitle = (place: Place): string =>
    place.properties.poi?.name || place.properties.address.freeformAddress;

/**
 * @ignore
 */
export const addMapIcon = (map: Map, classificationCode: POIClassification, customIcon: CustomIcon) => {
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
 * @group MapPlaces
 * @category Functions
 */
export const getIconIDForPlace = (place: Place, config: PlaceModuleConfig = {}, map?: Map): string => {
    const { iconConfig } = config;
    const iconStyle = iconConfig?.iconStyle || "pin";
    const classificationCode = place.properties.poi?.classifications?.[0]?.code as POIClassification;
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
 * function to get category of a place mapped to poi layer categories so the poi layer style apply to it.
 * @param place
 * @ignore
 */
export const getCategoryForPlace = (place: Place): string => {
    let category = (place.properties.poi?.classifications?.[0]?.code as POIClassification)?.toLowerCase();
    // if it's one of the different categories between search and poi layer, use poi layer category
    if (category in searchToPOILayerClassificationMapping) {
        category = searchToPOILayerClassificationMapping[category];
    }
    return category;
};

/**
 * @ignore
 * @param textSize
 */
export const getTextSizeSpec = (
    textSize?: DataDrivenPropertyValueSpecification<number>
): DataDrivenPropertyValueSpecification<number> => {
    return JSON.parse(JSON.stringify(textSize)?.replace(/name/g, TITLE));
};

/**
 * @ignore
 */
const getPOILayerSpecs = (map: Map) => {
    const { layout, paint } = map?.getStyle().layers.filter((layer) => layer.id == "POI")[0] || {};
    const textSize = (layout as SymbolLayerSpecification["layout"])?.["text-size"];
    return {
        id: placesLayerID,
        type: "symbol",
        paint,
        layout: {
            ...layout,
            "text-field": ["get", TITLE],
            "icon-image": ["get", ICON_ID],
            ...(textSize && { "text-size": getTextSizeSpec(textSize) })
        }
    };
};

/**
 * @ignore
 * @param iconConfig
 * @param map
 */
export const getPlacesLayerSpec = (iconConfig: PlaceIconConfig = {}, map?: Map) => {
    let layerSpec;
    const isPOILikeStyle = iconConfig?.iconStyle == "poi-like";
    if (isPOILikeStyle && map) {
        layerSpec = getPOILayerSpecs(map);
    } else {
        layerSpec = { ...placesLayerSpec, id: placesLayerID };
    }
    return layerSpec as LayerSpecWithSource;
};

/**
 * @ignore
 * @param iconConfig
 * @param map
 */
export const changePlacesLayerSpecs = (iconConfig: PlaceIconConfig, map: Map) => {
    const layerSpec = getPlacesLayerSpec(iconConfig, map);
    if (layerSpec.layout) {
        for (const [property, value] of Object.entries(layerSpec.layout)) {
            map.setLayoutProperty(placesLayerID, property, value);
        }
    }
    if (layerSpec.paint) {
        for (const [property, value] of Object.entries(layerSpec.paint)) {
            map.setPaintProperty(placesLayerID, property, value);
        }
    }
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
): Places<PlaceDisplayProps & CommonPlaceProps> => ({
    ...places,
    features: places.features.map((place) => ({
        ...place,
        properties: {
            ...place.properties,
            title: buildPlaceTitle(place),
            iconID: getIconIDForPlace(place, config, map),
            ...(config?.iconConfig?.iconStyle == "poi-like" && { category: getCategoryForPlace(place) })
        }
    }))
});
