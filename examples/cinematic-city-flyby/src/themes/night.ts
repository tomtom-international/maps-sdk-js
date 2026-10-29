import { auroraVeil, crtScanlines, greenPhosphor } from '../themePasses';
import { fontsource } from './font';
import { PALETTES } from './palettes';
import { type FlybyTheme, look } from './theme';

export const nightThemes = [
    {
        label: look('Gilded'),
        group: 'Neon and night',
        style: 'streetDark',
        // Art deco at night: navy, gold leaf, bronze, a deep blue and champagne.
        theme: { colors: ['#0a0f1f', '#141b30', '#d4af37', '#8c6d1f', '#2a3b5f', '#f3e6c4'], mode: 'dark' },
        sky: { color: '#060a16', horizon: '#7a6230' },
        font: fontsource('cinzel', { italic: false }),
        sun: { direction: 240, altitude: 25 },
        buildings: {
            facade: { pattern: 'office', intensity: 0.9 },
            walls: { color: '#121a2e', palette: PALETTES.dusk, paletteIntensity: 0.6, variation: 0.25 },
            roofs: { color: '#0c1222' },
            windows: { color: '#1c2742' },
            reflections: { intensity: 0.9 },
            litWindows: { color: '#ffcf70', fraction: 0.22, intensity: 0.8 },
            light: { color: '#ffd27a', intensity: 0.5 },
            ambientLight: { color: '#2a3b6b', intensity: 0.5 },
        },
        landmarks: { color: '#e8c873' },
        effects: {
            bloom: { intensity: 1, threshold: 0.4, radius: 30 },
            glare: { intensity: 0.38, threshold: 0.5, length: 32, rays: 4, angle: 0, only: ['#ffcf70'] },
            depthOfField: { intensity: 16, focus: 0.3, band: 0.3, bokeh: 0.9 },
            grade: { contrast: 1.15, saturation: 1.1 },
            fog: { intensity: 0.35, reach: 0.5 },
            edgeBlur: { intensity: 6, reach: 0.45 },
            tint: { color: '#d4af37', opacity: 0.05 },
            vignette: { intensity: -0.55 },
        },
    },
    {
        label: look('Aurora'),
        group: 'Neon and night',
        style: 'streetDark',
        // A polar night: ink blue, aurora green and violet, a deep teal and an icy white.
        theme: { colors: ['#060b1a', '#0e1830', '#33f0c0', '#8a5cff', '#1f4f7a', '#d8f3ff'], mode: 'dark' },
        sky: { color: '#04061a', horizon: '#1fd6a4' },
        font: fontsource('josefin-sans'),
        sun: { direction: 20, altitude: 12 },
        buildings: {
            // Lit from the north by the aurora, glass catching its green and violet.
            facade: { pattern: 'glass', intensity: 0.9 },
            walls: { color: '#0c1426' },
            windows: { color: '#0d2238' },
            reflections: { intensity: 1 },
            litWindows: { color: '#bff8ea', fraction: 0.08, intensity: 0.5 },
            light: { color: '#7af5d0', intensity: 0.35 },
            ambientLight: { color: '#5b47c9', intensity: 0.6 },
        },
        landmarks: { color: '#a9f5e0' },
        effects: {
            bloom: { intensity: 1, threshold: 0.35, radius: 32 },
            // Only the lit windows streak: the icy water and the mint landmarks sit just off their colour.
            glare: {
                intensity: 0.42,
                threshold: 0.5,
                length: 54,
                rays: 2,
                angle: 90,
                only: ['#bff8ea'],
                onlyTolerance: 0.06,
            },
            depthOfField: { intensity: 16, focus: 0.3, band: 0.3, bokeh: 0.8 },
            grade: { contrast: 1.1, saturation: 1.2 },
            fog: { intensity: 0.35, reach: 0.5 },
            edgeBlur: { intensity: 6, reach: 0.45 },
            tint: { color: '#5b3cc4', opacity: 0.06 },
            vignette: { intensity: -0.5 },
        },
        pass: auroraVeil,
    },
    {
        label: look('Neon'),
        group: 'Neon and night',
        style: 'streetDark',
        // Night neon: near black, plum, magenta, cyan, electric violet and a pale lilac.
        theme: { colors: ['#07020f', '#140a26', '#ff2bd6', '#00e5ff', '#7a00ff', '#f4e9ff'], mode: 'dark' },
        sky: { color: '#0a0218', horizon: '#ff2bd6' },
        font: fontsource('orbitron', { italic: false }),
        sun: { direction: 300, altitude: 20 },
        buildings: {
            facade: { pattern: 'glass', intensity: 1 },
            // Dark glass tinted by the theme's magenta, cyan and violet, a different mix on every tower.
            walls: { color: '#120a24', palette: PALETTES.accent, paletteMode: 'blend', paletteIntensity: 0.15 },
            windows: { color: '#1a0f33' },
            reflections: { intensity: 1 },
            litWindows: { color: '#b8f6ff', fraction: 0.14, intensity: 0.7 },
            light: { color: '#ff2bd6', intensity: 0.45 },
            ambientLight: { color: '#5a1aa8', intensity: 0.6 },
        },
        landmarks: { color: '#ff7ae8' },
        surfaces: { visible: false },
        effects: {
            bloom: { intensity: 1, threshold: 0.35, radius: 34 },
            // An anamorphic lens: one long horizontal flare through every lit window, paler than the cyan water.
            glare: { intensity: 0.4, threshold: 0.55, length: 58, rays: 2, angle: 0, only: ['#b8f6ff'] },
            depthOfField: { intensity: 16, focus: 0.3, band: 0.3, bokeh: 0.9 },
            grade: { contrast: 1.2, saturation: 1.4 },
            fog: { intensity: 0.3, reach: 0.45 },
            edgeBlur: { intensity: 6, reach: 0.45 },
            tint: { color: '#ff2bd6', opacity: 0.05 },
            vignette: { intensity: -0.55 },
        },
        pass: crtScanlines,
    },
    {
        label: look('Neo'),
        group: 'Neon and night',
        style: 'streetDark',
        // Black, phosphor green in three strengths, and a pale green for the labels.
        theme: { colors: ['#050805', '#141414', '#00ff41', '#008f11', '#003b00', '#c8ffd0'], mode: 'dark' },
        sky: { color: '#010702', horizon: '#0f5a24' },
        font: fontsource('jetbrains-mono'),
        sun: { direction: 200, altitude: 35 },
        buildings: {
            // Dark glass that mirrors a green sky, a few panes lit.
            facade: { pattern: 'glass', intensity: 1 },
            walls: { color: '#03170a' },
            roofs: { color: '#020f05' },
            windows: { color: '#062a12' },
            reflections: { intensity: 0.8 },
            litWindows: { color: '#00ff41', fraction: 0.12, intensity: 0.55 },
            light: { color: '#00ff41', intensity: 0.2 },
            ambientLight: { color: '#2fae52', intensity: 0.6 },
        },
        landmarks: { color: '#7dffa0' },
        surfaces: { visible: false },
        effects: {
            bloom: { intensity: 1, threshold: 0.4, radius: 28 },
            depthOfField: { intensity: 14, focus: 0.3, band: 0.3, bokeh: 0.8 },
            grade: { contrast: 1.2, saturation: 1.2 },
            fog: { intensity: 0.35, reach: 0.45 },
            edgeBlur: { intensity: 6, reach: 0.4 },
            tint: { color: '#00ff41', opacity: 0.05 },
            vignette: { intensity: -0.6 },
        },
        pass: greenPhosphor,
    },
] satisfies FlybyTheme[];
