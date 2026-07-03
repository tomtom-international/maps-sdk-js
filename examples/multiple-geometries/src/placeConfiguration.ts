import type { GeometriesModuleConfig } from '@tomtom-org/maps-sdk/map';
import type { GeocodingParams } from '@tomtom-org/maps-sdk/services';

export type Config = {
    searchConfig: Partial<GeocodingParams>;
    geometryConfig: GeometriesModuleConfig;
};

export type NamedConfigs = Record<string, Config>;

const line: GeometriesModuleConfig['line'] = { color: '#0A3653' };

export const namedConfigs: NamedConfigs = {
    france: {
        searchConfig: { countries: ['FR'], geographyTypes: ['CountrySubdivision'] },
        geometryConfig: { fill: { color: 'warm', opacity: 0.6 }, line },
    },
    italy: {
        searchConfig: { countries: ['IT'], geographyTypes: ['CountrySubdivision'] },
        geometryConfig: { fill: { color: 'cold', opacity: 0.6 }, line },
    },
    netherlands: {
        searchConfig: { countries: ['NL'], geographyTypes: ['CountrySubdivision'] },
        geometryConfig: { fill: { color: 'contrastRetro', opacity: 0.6 }, line },
    },
    germany: {
        searchConfig: { countries: ['DE'], geographyTypes: ['CountrySubdivision'] },
        geometryConfig: {
            fill: {
                color: 'blueToRed',
                opacity: ['interpolate', ['linear'], ['zoom'], 6, 1, 8, 0.5, 12, 0],
            },
            line,
        },
    },
    spain: {
        searchConfig: { countries: ['ES'], geographyTypes: ['CountrySubdivision'] },
        geometryConfig: { fill: { color: '#00bbff', opacity: 0.2 }, line },
    },
    chicagoDistricts: {
        searchConfig: { boundingBox: [-87.70362, 41.73845, -87.57001, 41.83279], geographyTypes: ['Neighbourhood'] },
        geometryConfig: { fill: { color: 'pastelRainbow', opacity: 0.2 }, line },
    },
    chicagoPostcodes: {
        searchConfig: { boundingBox: [-87.70362, 41.73845, -87.57001, 41.83279], geographyTypes: ['PostalCodeArea'] },
        geometryConfig: { fill: { color: 'fadedGreenToBlue', opacity: 0.3 }, line },
    },
};
