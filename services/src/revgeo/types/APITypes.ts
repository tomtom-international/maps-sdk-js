import { AddressProperties, LocationDataSources, LocationType, Mapcode, SideOfStreet } from "@anw/go-sdk-js/core";

/**
 * @group Reverse Geocoding
 * @category Types
 */
export type ReverseGeocodingResponseAPI = {
    summary: {
        queryTime: number;
        numResults: number;
    };
    addresses: [
        {
            address: AddressProperties & {
                boundingBox: {
                    northEast: string;
                    southWest: string;
                    entity: "position";
                };
                sideOfStreet: SideOfStreet;
                offsetPosition: string;
            };
            dataSources: LocationDataSources;
            entityType: LocationType;
            mapcodes?: Mapcode[];
            position: string;
        }
    ];
};
