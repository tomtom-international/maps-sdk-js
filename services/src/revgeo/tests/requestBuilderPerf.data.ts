import type { ReverseGeocodingParams } from '../types/reverseGeocodingParams';

const reverseGeocodeReqObjects: [string, ReverseGeocodingParams][] = [
    [
        'Performance Test',
        {
            position: [1.12345, 23.45678],
            apiKey: 'APIKEY',
            commonBaseURL: 'https://api.tomtom.com',
            language: 'es-ES',
            allowFreeformNewline: true,
            geographyType: [
                'Country',
                'Municipality',
                'MunicipalitySubdivision',
                'CountrySubdivision',
                'CountryTertiarySubdivision',
                'CountrySecondarySubdivision',
                'PostalCodeArea',
            ],
            mapcodes: ['Local', 'International'],
            heading: 30,
            number: '10A',
            radiusMeters: 30,
            returnRoadUse: true,
            returnSpeedLimit: true,
            roadUses: ['LimitedAccess', 'Arterial', 'Terminal', 'Ramp', 'Rotary', 'LocalStreet'],
            view: 'AR',
        },
    ],
];

export default reverseGeocodeReqObjects;
