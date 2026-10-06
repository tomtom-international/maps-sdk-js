import type { TerrainHillshadeConfig } from '@tomtom-org/maps-sdk/map';

export type Look = { label: string; hillshade: TerrainHillshadeConfig };

// Each look is a whole hillshade config: picking one replaces every setting the previous one made.
export const looks: Look[] = [
    {
        // Violet shadows and warm light, after the Swiss school of relief shading.
        label: 'Swiss relief',
        hillshade: {
            method: 'multidirectional',
            lightDirection: 315,
            lightAltitude: 45,
            exaggeration: 0.35,
            shadowColor: '#a49dd6',
            highlightColor: '#fff1cc',
            accentColor: '#7a5c45',
        },
    },
    {
        label: 'Etching',
        hillshade: {
            method: 'igor',
            exaggeration: 0.5,
            shadowColor: '#4a3522',
            highlightColor: '#f6e7c8',
            accentColor: '#2a1d12',
        },
    },
    {
        label: 'Low winter sun',
        hillshade: {
            method: 'basic',
            lightDirection: 290,
            lightAltitude: 15,
            exaggeration: 0.35,
            shadowColor: '#6584b0',
            highlightColor: '#ffd9a8',
        },
    },
    {
        // Made for the dark styles: lit ridges over unlit valleys.
        label: 'Night ridge',
        hillshade: {
            method: 'multidirectional',
            lightAltitude: 50,
            exaggeration: 0.35,
            shadowColor: '#000000',
            highlightColor: '#7fd4ff',
            accentColor: '#0b1d3a',
        },
    },
    { label: 'Style default', hillshade: { exaggeration: 0.5 } },
];
