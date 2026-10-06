import type { GeometriesModuleConfig } from '@tomtom-org/maps-sdk/map';
import type { GeocodingParams } from '@tomtom-org/maps-sdk/services';

export type Config = {
    searchConfig: Partial<GeocodingParams>;
    geometryConfig: GeometriesModuleConfig;
};

export type NamedConfigs = Record<string, Config>;

const line: GeometriesModuleConfig['line'] = { color: '#0A3653' };

// Each country's own colours, given to the subdivisions in turn.
const warm = ['#793F0D', '#AC703D', '#C38E63', '#E49969', '#E5AE86', '#EEC5A9', '#6E7649', '#9D9754', '#C7C397'];
const cold = ['#344464', '#548ca4', '#549cac', '#2c445c', '#a4ccd4', '#acbccc', '#b4c4d4', '#acd4cc', '#5c8ca4'];
const contrastRetro = [
    '#001219',
    '#005f73',
    '#0a9396',
    '#94d2bd',
    '#e9d8a6',
    '#ee9b00',
    '#ca6702',
    '#bb3e03',
    '#ae2012',
];
const blueToRed = ['#033270', '#1368aa', '#4091c9', '#9dcee2', '#fedfd4', '#f29479', '#f26a4f', '#ef3c2d', '#cb1b16'];
const pastelRainbow = [
    '#54478c',
    '#2c699a',
    '#048ba8',
    '#0db39e',
    '#16db93',
    '#83e377',
    '#b9e769',
    '#efea5a',
    '#f29e4c',
];
const greenToBlue = ['#d9ed92', '#b5e48c', '#99d98c', '#76c893', '#52b69a', '#34a0a4', '#168aad', '#1a759f', '#184e77'];

export const namedConfigs: NamedConfigs = {
    france: {
        searchConfig: { filters: { countries: ['FR'], geographyTypes: ['CountrySubdivision'] } },
        geometryConfig: { fill: { palette: warm, opacity: 0.6 }, line },
    },
    italy: {
        searchConfig: { filters: { countries: ['IT'], geographyTypes: ['CountrySubdivision'] } },
        geometryConfig: { fill: { palette: cold, opacity: 0.6 }, line },
    },
    netherlands: {
        searchConfig: { filters: { countries: ['NL'], geographyTypes: ['CountrySubdivision'] } },
        geometryConfig: { fill: { palette: contrastRetro, opacity: 0.6 }, line },
    },
    germany: {
        searchConfig: { filters: { countries: ['DE'], geographyTypes: ['CountrySubdivision'] } },
        geometryConfig: {
            fill: {
                palette: blueToRed,
                opacity: ['interpolate', ['linear'], ['zoom'], 6, 1, 8, 0.5, 12, 0],
            },
            line,
        },
    },
    spain: {
        searchConfig: { filters: { countries: ['ES'], geographyTypes: ['CountrySubdivision'] } },
        geometryConfig: { fill: { color: '#00bbff', opacity: 0.2 }, line },
    },
    chicagoDistricts: {
        searchConfig: {
            geoBias: { boundingBox: [-87.70362, 41.73845, -87.57001, 41.83279] },
            filters: { geographyTypes: ['Neighbourhood'] },
        },
        geometryConfig: { fill: { palette: pastelRainbow, opacity: 0.2 }, line },
    },
    chicagoPostcodes: {
        searchConfig: {
            geoBias: { boundingBox: [-87.70362, 41.73845, -87.57001, 41.83279] },
            filters: { geographyTypes: ['PostalCodeArea'] },
        },
        geometryConfig: { fill: { palette: greenToBlue, opacity: 0.3 }, line },
    },
};
