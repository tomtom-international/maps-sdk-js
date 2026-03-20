import { Color } from '@maplibre/maplibre-gl-style-spec';

/**
 * Darkens a CSS color by a given factor (0 = unchanged, 1 = black).
 * Accepts any valid CSS color (hex, rgb(), hsl(), named colors, etc.)
 * using MapLibre's own color parser for full consistency.
 * Returns undefined if the color cannot be parsed.
 * @ignore
 */
export const darkenColor = (cssColor: string, darkenFactor: number): string | undefined => {
    const parsed = Color.parse(cssColor);
    if (!parsed) {
        return undefined;
    }
    const brightnessScale = 1 - darkenFactor;
    const red = Math.round(parsed.r * 255 * brightnessScale);
    const green = Math.round(parsed.g * 255 * brightnessScale);
    const blue = Math.round(parsed.b * 255 * brightnessScale);
    return `#${[red, green, blue].map((channel) => channel.toString(16).padStart(2, '0')).join('')}`;
};
