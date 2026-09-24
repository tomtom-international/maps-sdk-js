import type { GeocodingParams } from '../types/geocodingParams';

export const geocodingReqObjects: GeocodingParams = {
    query: 'Silbersteinstraße 53, 12051 Berlin',
    apiKey: 'APIKEY',
    commonBaseURL: 'https://api.tomtom.com',
    countries: ['NLD', 'DEU'],
    geoBias: { position: [13.41143, 52.52342], radiusMeters: 30 },
    language: 'de-DE',
    offset: 100,
    mapcodes: ['Local', 'International'],
    extendedPostalCodesFor: ['Addr', 'Geo', 'PAD'],
};
