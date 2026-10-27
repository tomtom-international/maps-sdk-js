import type { StandardStyleID } from '@tomtom-org/maps-sdk/map';
import { type Buildings3DConfig, type Landmarks3DConfig } from '@tomtom-org/maps-sdk-plugin-landmarks-3d';
import type { MapEffectsConfig } from '@tomtom-org/maps-sdk-plugin-map-effects';
import type { MapThemeMode } from '@tomtom-org/maps-sdk-plugin-map-theme';

// The wall palettes the looks draw from: CSS colours, and map colours by knob id, which follow the theme.
const PALETTES = {
    sandstone: ['#efe4cf', '#e2cfa8', '#cdb07f', '#d9c7a6'],
    pastel: ['#f3c5b5', '#f5e2a0', '#bfdccb', '#c6d4ee', '#e9c3d8'],
    nordic: ['#f4f1ea', '#dcd7cb', '#c9cfd4', '#aab5bf', '#e7c9a9'],
    terracotta: ['#f1e5d0', '#e3bf94', '#cf8f60', '#b96c48'],
    dusk: ['#2b2f4a', '#3a2f55', '#24384d', '#463049'],
    foundations: ['colors.artificial', 'colors.land', 'colors.park', 'colors.water'],
};

/** One look of the city: the map style and its colours, the 3D buildings and landmarks, and the effects over them. */
export type CityLook = {
    label: string;
    style: StandardStyleID;
    /**
     * The colours the map's own are derived from: a neutral, a text colour and a few accents. The land
     * comes from the neutral, toned down when it is saturated.
     */
    theme: { colors: string[]; mode: MapThemeMode };
    buildings: Buildings3DConfig;
    landmarks: Landmarks3DConfig;
    effects: MapEffectsConfig;
};

export const cityLooks: CityLook[] = [
    {
        label: 'Golden hour',
        style: 'streetLight',
        // Sand, sea, olive, burnt orange and espresso.
        theme: { colors: ['#efe8dc', '#3d7ea6', '#8aa35c', '#d9822b', '#3b2a1e'], mode: 'light' },
        buildings: {
            // A low warm sun on one side, the cool blue of the sky in the shade on the other, over walls
            // of sun-baked plaster, from cream to clay.
            walls: {
                palette: PALETTES.terracotta,
                paletteMode: 'blend',
                paletteIntensity: 0.6,
                variation: 0.25,
            },
            windows: { color: '#6f8aa3' },
            light: { direction: 215, altitude: 12, color: '#ffb36b', intensity: 1 },
            ambientLight: { color: '#c3d0e2', intensity: 0.55 },
            shadows: { intensity: 0.85 },
        },
        landmarks: { color: '#f0d9b5' },
        effects: {
            bloom: { intensity: 0.45, threshold: 0.65, radius: 22 },
            depthOfField: { intensity: 22, focus: 0.35, band: 0.25, bokeh: 0.6 },
            grade: { brightness: 1.05, contrast: 1.08, saturation: 1.2 },
            vignette: { intensity: -0.35 },
        },
    },
    {
        label: 'Neon night',
        style: 'streetDark',
        // Ink, graphite, magenta, indigo, violet and a pale lilac for the labels.
        theme: { colors: ['#0b0c1f', '#141414', '#ff2fd0', '#1b1f4a', '#7a5cff', '#e8e6ff'], mode: 'dark' },
        buildings: {
            // Near-black towers of glass, most of it lit: the bloom glows only as wide as the bright area it spreads.
            facade: { pattern: 'glass', intensity: 1 },
            walls: { color: '#161a2e', palette: PALETTES.dusk, paletteIntensity: 0.7, variation: 0.3 },
            windows: { color: '#151a33' },
            litWindows: { color: '#9ef6ff', fraction: 0.8, intensity: 1 },
            light: { color: '#7a5cff', intensity: 0.25 },
            ambientLight: { color: '#3a2a6e', intensity: 0.55 },
        },
        landmarks: { color: '#d7c8ff' },
        effects: {
            bloom: { intensity: 1, threshold: 0.25, radius: 10 },
            // Most windows are lit, so a faint, short star each.
            glare: { intensity: 0.25, threshold: 0.6, length: 20, rays: 4, only: ['#9ef6ff'] },
            depthOfField: { intensity: 22, focus: 0.35, band: 0.25, bokeh: 1 },
            grade: { contrast: 1.15, saturation: 1.3 },
            vignette: { intensity: -0.55 },
        },
    },
    {
        label: 'Miniature',
        style: 'streetLight',
        // Cream, pool blue, mint, coral and charcoal: a toy town.
        theme: { colors: ['#f3f1ec', '#8fd0e8', '#a9dc9a', '#f2907b', '#3d3d3d'], mode: 'light' },
        buildings: {
            facade: { pattern: 'residential', intensity: 0.6 },
            // Every house painted its own pastel, as on a model railway.
            walls: { palette: PALETTES.pastel, paletteIntensity: 0.85, variation: 0.2 },
            light: { direction: 200, altitude: 55, intensity: 0.9 },
            shadows: { intensity: 0.6 },
        },
        landmarks: { color: '#f4a48f' },
        effects: {
            // A thin band of focus at the landmark's foot, between two strong blurs, makes the city look like a model.
            depthOfField: { intensity: 24, focus: 0.6, band: 0.08, bokeh: 0.3 },
            grade: { brightness: 1.05, contrast: 1.1, saturation: 1.4 },
        },
    },
    {
        label: 'Moonlight',
        style: 'monoDark',
        // Midnight, navy, pine, steel blue, frost and graphite.
        theme: { colors: ['#0f1a2b', '#1d3557', '#2a4d3a', '#7fa7d9', '#dce6f2', '#141414'], mode: 'dark' },
        buildings: {
            // A hint of the theme's own navy, pine and steel blue in the walls.
            walls: { color: '#2a3346', palette: PALETTES.foundations, paletteIntensity: 0.3, variation: 0.2 },
            litWindows: { color: '#ffe2b0', fraction: 0.15, intensity: 0.7 },
            light: { direction: 120, altitude: 25, color: '#9fb8e8', intensity: 0.4 },
        },
        landmarks: { color: '#9fb8e8' },
        effects: {
            bloom: { intensity: 0.6, threshold: 0.45, radius: 18 },
            glare: { intensity: 0.35, threshold: 0.5, length: 28, rays: 4, only: ['#ffe2b0'] },
            depthOfField: { intensity: 18, focus: 0.35, band: 0.3, bokeh: 0.6 },
            fog: { intensity: 0.5, reach: 0.5 },
            vignette: { intensity: -0.4 },
        },
    },
    {
        label: "Architect's model",
        style: 'monoLight',
        // Paper white, pale stone and graphite.
        theme: { colors: ['#f7f7f5', '#d9e2e8', '#dfe5d8', '#c4c4c4', '#333333'], mode: 'light' },
        buildings: {
            facade: { pattern: 'plain' },
            walls: { color: '#fbfaf7' },
            roofs: { color: '#f0eee9' },
            light: { direction: 225, altitude: 40, color: '#ffffff', intensity: 0.85 },
            ambientLight: { color: '#ffffff', intensity: 0.5 },
            shadows: { intensity: 0.75 },
        },
        landmarks: { color: '#ffffff' },
        effects: {
            depthOfField: { intensity: 18, focus: 0.35, band: 0.25, bokeh: 0.4 },
            grade: { contrast: 1.05 },
            vignette: { intensity: -0.25 },
        },
    },
    {
        label: 'Misty dawn',
        style: 'streetLight',
        // Pale mist, slate water, sage, blush and a cool charcoal.
        theme: { colors: ['#e9edf0', '#7f9db5', '#9db59a', '#e8a9a0', '#2f3a45'], mode: 'light' },
        buildings: {
            walls: { palette: PALETTES.nordic, paletteMode: 'blend', paletteIntensity: 0.5, variation: 0.15 },
            windows: { color: '#9fb2c4' },
            light: { direction: 95, altitude: 8, color: '#ffc9b8', intensity: 0.8 },
            ambientLight: { color: '#dfe7f0', intensity: 0.7 },
            shadows: { intensity: 0.5 },
        },
        landmarks: { color: '#f3e6e0' },
        effects: {
            bloom: { intensity: 0.35, threshold: 0.7, radius: 30 },
            depthOfField: { intensity: 20, focus: 0.35, band: 0.3, bokeh: 0.3 },
            fog: { intensity: 0.8, reach: 0.7 },
            grade: { brightness: 1.08, contrast: 0.9, saturation: 0.85 },
        },
    },
    {
        label: 'Film noir',
        style: 'monoDark',
        // Greys only: the grade takes the last of the colour out.
        theme: { colors: ['#121212', '#1c1c1c', '#3a3a3a', '#8a8a8a', '#e6e6e6'], mode: 'dark' },
        buildings: {
            // No palette, only each building's own shade of grey.
            walls: { color: '#6e6e6e', variation: 0.4 },
            litWindows: { color: '#fff4d6', fraction: 0.25, intensity: 0.9 },
            // A hard, low key light on the faces towards the camera, and deep shadows.
            light: { direction: 210, altitude: 25, color: '#ffffff', intensity: 1 },
            ambientLight: { color: '#ffffff', intensity: 0.3 },
            shadows: { intensity: 0.9 },
        },
        landmarks: { color: '#d0d0d0' },
        effects: {
            bloom: { intensity: 0.7, threshold: 0.5, radius: 16 },
            glare: { intensity: 0.3, threshold: 0.55, length: 40, rays: 2, angle: 0, only: ['#fff4d6'] },
            depthOfField: { intensity: 20, focus: 0.35, band: 0.25, bokeh: 0.9 },
            grade: { contrast: 1.35, saturation: 0 },
            vignette: { intensity: -0.7 },
        },
    },
    {
        label: 'Desert dusk',
        style: 'streetLight',
        // Dust, dusk blue, dry olive, terracotta and burnt umber.
        theme: { colors: ['#ece5dc', '#4f7ca3', '#b5a26a', '#e2643a', '#40261c'], mode: 'light' },
        buildings: {
            // The last of the sun, almost level, under a violet sky; the first windows coming on.
            walls: { palette: PALETTES.sandstone, paletteMode: 'blend', paletteIntensity: 0.8, variation: 0.2 },
            windows: { color: '#3e4f6b' },
            litWindows: { color: '#ffd08a', fraction: 0.12, intensity: 0.6 },
            light: { direction: 280, altitude: 5, color: '#ff8a4c', intensity: 1 },
            ambientLight: { color: '#8a7fb8', intensity: 0.55 },
            shadows: { intensity: 0.9 },
        },
        landmarks: { color: '#f2c9a0' },
        effects: {
            bloom: { intensity: 0.55, threshold: 0.55, radius: 24 },
            glare: { intensity: 0.3, threshold: 0.5, length: 24, rays: 4, only: ['#ffd08a'] },
            depthOfField: { intensity: 20, focus: 0.35, band: 0.25, bokeh: 0.7 },
            grade: { contrast: 1.1, saturation: 1.25 },
            tint: { color: '#ff6a3d', opacity: 0.08 },
            vignette: { intensity: -0.45 },
        },
    },
];
