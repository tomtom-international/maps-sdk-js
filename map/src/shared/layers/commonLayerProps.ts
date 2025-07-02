import type { ExpressionSpecification } from 'maplibre-gl';

export const MAP_BOLD_FONT = 'Noto-Bold';
export const MAP_REGULAR_FONT = 'Noto-Regular';
export const MAP_MEDIUM_FONT = 'Noto-Medium';
export const MAP_ITALIC_FONT = 'NotoSans-MediumItalic';
export const DEFAULT_TEXT_SIZE: ExpressionSpecification = ['interpolate', ['linear'], ['zoom'], 10, 12, 16, 14];

export const mapFonts = [MAP_REGULAR_FONT, MAP_ITALIC_FONT, MAP_BOLD_FONT, MAP_MEDIUM_FONT] as const;
export type MapFont = (typeof mapFonts)[number];
