import { DataDrivenPropertyValueSpecification, Map, SymbolLayerSpecification } from "maplibre-gl";
import { Place, Places, CommonPlaceProps } from "@anw/go-sdk-js/core";
import { ICON_ID, PlaceDisplayProps, TITLE } from "./types/PlaceDisplayProps";
import { CustomIcon, PlaceIconConfig, PlaceModuleConfig } from "./types/PlaceModuleConfig";
import { placesLayerSpec } from "./layers/PlacesLayers";
import {
    MapStylePOIClassification,
    poiClassificationToIconID,
    placeToPOILayerClassificationMapping
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
 * @group MapPlaces
 * @category Functions
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
 * function to get category of a place mapped to poi layer categories so the poi layer style apply to it.
 * @param place
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
const getPOILayerSpecs = (map: Map): Omit<SymbolLayerSpecification, "source"> => {
    const layer = (map.getStyle().layers.filter((layer) => layer.id == "POI")[0] as SymbolLayerSpecification) || {};
    const textSize = (layer.layout as SymbolLayerSpecification["layout"])?.["text-size"];
    return {
        id: placesLayerID,
        type: "symbol",
        paint: layer.paint,
        layout: {
            ...layer.layout,
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
export const getPlacesLayerSpec = (
    iconConfig: PlaceIconConfig | undefined,
    map: Map
): Omit<SymbolLayerSpecification, "source"> =>
    iconConfig?.iconStyle == "poi-like" ? getPOILayerSpecs(map) : { ...placesLayerSpec, id: placesLayerID };

type LayoutPaint = { layout?: any; paint?: any };

/**
 * Applies the layout and paint properties from layerSpec
 * while unsetting (setting as undefined) the ones from previousSpec which no longer exist in layerSpec.
 * * This allows for a quick change of a layer visuals without removing-re-adding the layer.
 * @ignore
 * @param layerSpec The new layer from which to apply layout/pain props.
 * @param prevLayerSpec The previous layer to ensure layout/paint props are removed.
 * @param map
 */
export const changeLayoutAndPaintProps = (layerSpec: LayoutPaint, prevLayerSpec: LayoutPaint, map: Map) => {
    for (const property of Object.keys(prevLayerSpec.layout || [])) {
        if (!layerSpec.layout?.[property]) {
            map.setLayoutProperty(placesLayerID, property, undefined, { validate: false });
        }
    }
    for (const property of Object.keys(prevLayerSpec.paint || [])) {
        if (!layerSpec.paint?.[property as never]) {
            map.setPaintProperty(placesLayerID, property, undefined, { validate: false });
        }
    }
    for (const [property, value] of Object.entries(layerSpec.paint || [])) {
        map.setPaintProperty(placesLayerID, property, value, { validate: false });
    }

    for (const [property, value] of Object.entries(layerSpec.layout || [])) {
        map.setLayoutProperty(placesLayerID, property, value, { validate: false });
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
        geometry: {
            ...place.geometry,
            bbox: place.bbox
        },
        properties: {
            ...place.properties,
            id: place.id,
            title: buildPlaceTitle(place),
            iconID: getIconIDForPlace(place, config, map),
            ...(config?.iconConfig?.iconStyle == "poi-like" && { category: getPOILayerCategoryForPlace(place) })
        }
    }))
});
