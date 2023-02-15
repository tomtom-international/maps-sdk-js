import { MapStylePOIClassification } from "../poiIconIDMapping";

/**
 * Possible options for places icon style
 * "poi-like" will mimic poi layer style
 * @group MapPlaces
 * @category Types
 */
export type IconStyle = "pin" | "circle" | "poi-like";

/**
 * Custom Icon configuration for places
 * @group MapPlaces
 * @category Types
 */
export type CustomIcon = {
    category: MapStylePOIClassification;
    iconUrl: string;
};

/**
 * Places Icon Configuration
 * @group MapPlaces
 * @category Types
 */
export type PlaceIconConfig = {
    iconStyle?: IconStyle;
    customIcons?: CustomIcon[];
};

/**
 * Places layer configuration
 * @group MapPlaces
 * @category Types
 */
export type PlaceModuleConfig = {
    /**
     * Whether the layers for this module are to be interactive.
     * * The user can interact with the layers from this module.
     * @default false
     */
    interactive?: boolean;
    iconConfig?: PlaceIconConfig;
};
