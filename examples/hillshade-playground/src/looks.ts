import type { TerrainHillshadeConfig } from '@tomtom-org/maps-sdk/map';

export type Look = { label: string; hillshade: TerrainHillshadeConfig };

// Each look is a whole hillshade config: picking one replaces every setting the previous one made.
export const looks: Look[] = [
    {
        // Violet shadows and warm light, after the Swiss school of relief shading.
        label: 'Swiss relief',
        hillshade: {
            method: 'multidirectional',
            light: { direction: 315, altitude: 45 },
            intensity: 0.35,
            colors: { shaded: '#a49dd6', lit: '#fff1cc', steep: '#7a5c45' },
        },
    },
    {
        label: 'Etching',
        hillshade: {
            method: 'igor',
            intensity: 0.5,
            colors: { shaded: '#4a3522', lit: '#f6e7c8', steep: '#2a1d12' },
        },
    },
    {
        label: 'Low winter sun',
        hillshade: {
            method: 'basic',
            light: { direction: 290, altitude: 15 },
            intensity: 0.35,
            colors: { shaded: '#6584b0', lit: '#ffd9a8' },
        },
    },
    {
        // Made for the dark styles: lit ridges over unlit valleys.
        label: 'Night ridge',
        hillshade: {
            method: 'multidirectional',
            light: { altitude: 50 },
            intensity: 0.35,
            colors: { shaded: '#000000', lit: '#7fd4ff', steep: '#0b1d3a' },
        },
    },
    { label: 'Style default', hillshade: { intensity: 0.5 } },
];
