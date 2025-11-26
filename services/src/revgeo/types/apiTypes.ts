import type { AddressProperties, Mapcode, PlaceDataSources, PlaceType, SideOfStreet } from '@tomtom-org/maps-sdk/core';

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
                boundingBox?: {
                    northEast: string;
                    southWest: string;
                    entity: 'position';
                };
                sideOfStreet?: SideOfStreet;
                offsetPosition?: string;
                [key: string]: any; // Allow additional API fields
            };
            linkedAddress?: AddressProperties & {
                boundingBox?: {
                    northEast: string;
                    southWest: string;
                    entity: 'position';
                };
                [key: string]: any;
            };
            dataSources?: PlaceDataSources;
            entityType?: PlaceType;
            mapcodes?: Mapcode[];
            position: string;
            roadUse?: string[];
        },
    ];
};
