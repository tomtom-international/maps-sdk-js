import { DataDrivenPropertyValueSpecification } from "maplibre-gl";
import { Place } from "@anw/go-sdk-js/core";
import { MapStylePOIClassification } from "../poiIconIDMapping";
import { MapFont } from "../../shared";

/**
 * Possible options for places icon style
 * "poi-like" will mimic poi layer style
 */
export type IconStyle = "pin" | "circle" | "poi-like";

/**
 * Custom Icon configuration for places
 */
export type CustomIcon = {
    category: MapStylePOIClassification;
    iconUrl: string;
};

/**
 * Places Icon Configuration
 */
export type PlaceIconConfig = {
    iconStyle?: IconStyle;
    customIcons?: CustomIcon[];
};

/**
 * Places Label Configuration
 */
export type PlaceTextConfig = {
    /**
     * textField could be a function to calculate the value of the feature label that will be added to `title` property,
     * or a valid MapLibre expression to be used directly
     */
    textField?: ((place: Place) => string) | DataDrivenPropertyValueSpecification<string>;
    textSize?: DataDrivenPropertyValueSpecification<number>;
    textColor?: DataDrivenPropertyValueSpecification<string>;
    textFont?: DataDrivenPropertyValueSpecification<Array<MapFont>>;
    textHaloColor?: DataDrivenPropertyValueSpecification<string>;
    textHaloWidth?: DataDrivenPropertyValueSpecification<number>;
    textOffset?: DataDrivenPropertyValueSpecification<[number, number]>;
};

/**
 * Places layer configuration
 */
export type PlaceModuleConfig = {
    iconConfig?: PlaceIconConfig;
    textConfig?: PlaceTextConfig;
    extraFeatureProps?: { [key: string]: any };
};
