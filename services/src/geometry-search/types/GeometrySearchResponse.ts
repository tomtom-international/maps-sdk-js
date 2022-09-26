import { Places, CommonPlaceProps, Connector, OpeningHours, Classification, TimeZone } from "@anw/go-sdk-js/core";

type POI = {
    name: string;
    phone?: string;
    // override from Brand to string
    brands?: string[];
    url?: string;
    // override from categorySet and CategorySet
    categoryIds?: number[];
    categories?: string[];
    openingHours?: OpeningHours;
    classifications?: Classification[];
    timeZone?: TimeZone;
};

export type GeometrySearchResponseProps = CommonPlaceProps & {
    /**
     * Information about the original data source of the result
     */
    info?: string;
    /**
     * Information about the Points of Interest in the result. Optional section. Only present if CommonPlaceProps.type == POI
     */
    poi?: POI;
    /**
     * List of related Points Of Interest.
     */
    relatedPois?: {
        relationType: "child" | "parent";
        id: string;
    };
    /**
     * A list of chargingPark objects. Present only when the Points of Interest are of the Electric Vehicle Station type.
     */
    chargingPark?: {
        connectors: Connector[];
    };
};

export type GeometrySearchResponse = Places<GeometrySearchResponseProps>;
