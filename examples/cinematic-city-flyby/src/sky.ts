import type { MapColors } from '@tomtom-org/maps-sdk/map';
import type { FlybyTheme } from './themes';

const context = document.createElement('canvas').getContext('2d') as CanvasRenderingContext2D;

// The canvas reads back any CSS colour as `#rrggbb`, or as `rgba(…)` when it has an alpha.
const rgbOf = (cssColor: string): number[] => {
    context.fillStyle = '#000';
    context.fillStyle = cssColor;
    const read = context.fillStyle;
    return read.startsWith('#')
        ? [1, 3, 5].map((start) => Number.parseInt(read.slice(start, start + 2), 16))
        : (read.match(/[\d.]+/g) ?? []).slice(0, 3).map(Number);
};

const mixColors = (from: string, to: string, amount: number): string => {
    const [start, end] = [rgbOf(from), rgbOf(to)];
    return `rgb(${start.map((value, index) => Math.round(value + (end[index] - value) * amount)).join(', ')})`;
};

/**
 * The theme's sky, in tune with its map: a touch of the map's water overhead, and a horizon that
 * fades into its land, glowing in the theme's horizon colour where it has one.
 */
export const skyOf = ({ sky }: FlybyTheme, colors: Required<MapColors>) => ({
    visible: true,
    color: mixColors(sky.color, colors.water, 0.15),
    horizonColor: sky.horizon ? mixColors(colors.land, sky.horizon, 0.65) : mixColors(colors.land, sky.color, 0.35),
});
