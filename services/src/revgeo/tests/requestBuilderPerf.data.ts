import type { ReverseGeocodingParams } from '../types/reverseGeocodingParams';

const reverseGeocodeReqObjects: [string, ReverseGeocodingParams][] = [
    [
        'Performance Test',
        {
            position: [1.12345, 23.45678],
            apiKey: 'APIKEY',
            commonBaseURL: 'https://api.tomtom.com',
            language: 'es-ES',
            geographyType: [
                'Country',
                'Municipality',
                'MunicipalitySubdivision',
                'CountrySubdivision',
                'CountryTertiarySubdivision',
                'CountrySecondarySubdivision',
                'PostalCodeArea',
            ],
            heading: 30,
            radiusMeters: 30,
            view: 'AR',
        },
    ],
];

export default reverseGeocodeReqObjects;
