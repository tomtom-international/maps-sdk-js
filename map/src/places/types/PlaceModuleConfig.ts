import { POIClassification } from "../poiIconIDMapping";

export type IconStyle = "pin" | "circle" | "poi-like";
export type CustomIcon = {
    category: POIClassification;
    iconUrl: string;
};
export type PlaceIconConfig = {
    iconStyle?: IconStyle;
    customIcons?: CustomIcon[];
};
export type PlaceModuleConfig = {
    /**
     * Whether the layers for this module are to be interactive.
     * * The user can interact with the layers from this module.
     * @default false
     */
    interactive?: boolean;
    iconConfig?: PlaceIconConfig;
};
