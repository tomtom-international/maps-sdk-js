import type { GeometriesModuleConfig } from '@tomtom-org/maps-sdk/map';
import type { GeocodingParams } from '@tomtom-org/maps-sdk/services';

export type Config = {
    searchConfig: Partial<GeocodingParams>;
    geometryConfig: GeometriesModuleConfig;
};

export type NamedConfigs = Record<string, Config>;

const lineConfig: GeometriesModuleConfig['lineConfig'] = { lineColor: '#0A3653' };

export const namedConfigs: NamedConfigs = {
    france: {
        searchConfig: { countries: ['FR'], geographyTypes: ['CountrySubdivision'] },
        geometryConfig: { colorConfig: { fillColor: 'warm', fillOpacity: 0.6 }, lineConfig },
    },
    italy: {
        searchConfig: { countries: ['IT'], geographyTypes: ['CountrySubdivision'] },
        geometryConfig: { colorConfig: { fillColor: 'cold', fillOpacity: 0.6 }, lineConfig },
    },
    netherlands: {
        searchConfig: { countries: ['NL'], geographyTypes: ['CountrySubdivision'] },
        geometryConfig: { colorConfig: { fillColor: 'contrastRetro', fillOpacity: 0.6 }, lineConfig },
    },
    germany: {
        searchConfig: { countries: ['DE'], geographyTypes: ['CountrySubdivision'] },
        geometryConfig: {
            colorConfig: {
                fillColor: 'blueToRed',
                fillOpacity: ['interpolate', ['linear'], ['zoom'], 6, 1, 8, 0.5, 12, 0],
            },
            lineConfig,
        },
    },
    spain: {
        searchConfig: { countries: ['ES'], geographyTypes: ['CountrySubdivision'] },
        geometryConfig: { colorConfig: { fillColor: '#00bbff', fillOpacity: 0.2 }, lineConfig },
    },
    chicagoDistricts: {
        searchConfig: { boundingBox: [-87.70362, 41.73845, -87.57001, 41.83279], geographyTypes: ['Neighbourhood'] },
        geometryConfig: { colorConfig: { fillColor: 'pastelRainbow', fillOpacity: 0.2 }, lineConfig },
    },
    chicagoPostcodes: {
        searchConfig: { boundingBox: [-87.70362, 41.73845, -87.57001, 41.83279], geographyTypes: ['PostalCodeArea'] },
        geometryConfig: { colorConfig: { fillColor: 'fadedGreenToBlue', fillOpacity: 0.3 }, lineConfig },
    },
};
