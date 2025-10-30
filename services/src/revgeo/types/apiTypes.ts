import type { AddressProperties, Mapcode, PlaceDataSources, PlaceType, SideOfStreet } from '@tomtom-org/maps-sdk-js/core';

/**
 * @ignore
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
                    entity: 'position';
                };
                sideOfStreet: SideOfStreet;
                offsetPosition: string;
            };
            dataSources: PlaceDataSources;
            entityType: PlaceType;
            mapcodes?: Mapcode[];
            position: string;
        },
    ];
};
