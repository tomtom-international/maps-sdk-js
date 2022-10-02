import { Places, CommonPlaceProps, Connector, POI } from "@anw/go-sdk-js/core";

export type PlaceByIdResponseProps = CommonPlaceProps & {
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

export type PlaceByIdResponse = Places<PlaceByIdResponseProps>;
