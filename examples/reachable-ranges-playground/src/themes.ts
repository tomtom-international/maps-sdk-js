import type { MapColors } from '@tomtom-org/maps-sdk/map';
import { deriveMapColors } from '@tomtom-org/maps-sdk-plugin-map-theme';

// A theme starts from a handful of colours; the map-theme plugin gives them roles, accent and land
// among them. No theme leaves the map to its style's own colours.
export const themes: Record<string, Required<MapColors> | undefined> = {
    "The style's own": undefined,
    Primaries: deriveMapColors(['#1d3f8a', '#e63312', '#f5d000', '#111111', '#f4f1ea']),
    Earthy: deriveMapColors(['#f3e9d8', '#a0522d', '#6b8e23', '#4b3621', '#c9a66b']),
    Neon: deriveMapColors(['#0b0b14', '#ff2bd6', '#00e5ff', '#39ff14', '#f5f5f5'], { mode: 'dark' }),
};
