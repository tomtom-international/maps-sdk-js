import type { GeometriesModuleConfig } from '@tomtom-org/maps-sdk-js/map';
import type { GeocodingParams } from '@tomtom-org/maps-sdk-js/services';

export type Config = {
    searchConfig: Partial<GeocodingParams>;
    geometryConfig: GeometriesModuleConfig;
};

export type NamedConfigs = Record<string, Config>;

export const namedConfigs: NamedConfigs = {
    france: {
        searchConfig: { countries: ['FR'], geographyTypes: ['CountrySubdivision'] },
        geometryConfig: { colorConfig: { fillColor: 'warm', fillOpacity: 0.6 } },
    },
    italy: {
        searchConfig: { countries: ['IT'], geographyTypes: ['CountrySubdivision'] },
        geometryConfig: { colorConfig: { fillColor: 'cold', fillOpacity: 0.6 } },
    },
    netherlands: {
        searchConfig: { countries: ['NL'], geographyTypes: ['CountrySubdivision'] },
        geometryConfig: { colorConfig: { fillColor: 'contrastRetro', fillOpacity: 0.6 } },
    },
    germany: {
        searchConfig: { countries: ['DE'], geographyTypes: ['CountrySubdivision'] },
        geometryConfig: {
            colorConfig: {
                fillColor: 'blueToRed',
                fillOpacity: ['interpolate', ['linear'], ['zoom'], 6, 1, 8, 0.5, 12, 0],
            },
        },
    },
    spain: {
        searchConfig: { countries: ['ES'], geographyTypes: ['CountrySubdivision'] },
        geometryConfig: { colorConfig: { fillColor: '#00bbff', fillOpacity: 0.2 } },
    },
    chicagoDistricts: {
        searchConfig: { boundingBox: [-87.70362, 41.73845, -87.57001, 41.83279], geographyTypes: ['Neighbourhood'] },
        geometryConfig: { colorConfig: { fillColor: 'pastelRainbow', fillOpacity: 0.2 } },
    },
    chicagoPostcodes: {
        searchConfig: { boundingBox: [-87.70362, 41.73845, -87.57001, 41.83279], geographyTypes: ['PostalCodeArea'] },
        geometryConfig: { colorConfig: { fillColor: 'fadedGreenToBlue', fillOpacity: 0.3 } },
    },
};
