import type { ExpressionSpecification } from 'maplibre-gl';

/**
 * Bold font face used in the TomTom map style.
 *
 * @remarks
 * This is the primary bold font used for prominent labels and headings in the map.
 * Use this constant when creating custom layers to maintain visual consistency with the map style.
 *
 * @example
 * ```typescript
 * import { MAP_BOLD_FONT } from '@tomtom-international/maps-sdk-js/map';
 *
 * const textLayer = {
 *   type: 'symbol',
 *   layout: {
 *     'text-font': [MAP_BOLD_FONT],
 *     'text-field': ['get', 'name']
 *   }
 * };
 * ```
 *
 * @group Map Style
 */
export const MAP_BOLD_FONT = 'Noto-Bold';

/**
 * Regular font face used in the TomTom map style.
 *
 * @remarks
 * This is the standard font used for most text labels on the map.
 * Use this constant when creating custom layers to maintain visual consistency with the map style.
 *
 * @example
 * ```typescript
 * import { MAP_REGULAR_FONT } from '@tomtom-international/maps-sdk-js/map';
 *
 * const textLayer = {
 *   type: 'symbol',
 *   layout: {
 *     'text-font': [MAP_REGULAR_FONT],
 *     'text-field': ['get', 'description']
 *   }
 * };
 * ```
 *
 * @group Map Style
 */
export const MAP_REGULAR_FONT = 'Noto-Regular';

/**
 * Medium weight font face used in the TomTom map style.
 *
 * @remarks
 * This font provides a middle ground between regular and bold weights.
 * Use this constant when creating custom layers to maintain visual consistency with the map style.
 *
 * @example
 * ```typescript
 * import { MAP_MEDIUM_FONT } from '@tomtom-international/maps-sdk-js/map';
 *
 * const textLayer = {
 *   type: 'symbol',
 *   layout: {
 *     'text-font': [MAP_MEDIUM_FONT],
 *     'text-field': ['get', 'title']
 *   }
 * };
 * ```
 *
 * @group Map Style
 */
export const MAP_MEDIUM_FONT = 'Noto-Medium';

/**
 * Italic font face used in the TomTom map style.
 *
 * @remarks
 * This is the italic variant used for emphasized or secondary text labels.
 * Use this constant when creating custom layers to maintain visual consistency with the map style.
 *
 * @example
 * ```typescript
 * import { MAP_ITALIC_FONT } from '@tomtom-international/maps-sdk-js/map';
 *
 * const textLayer = {
 *   type: 'symbol',
 *   layout: {
 *     'text-font': [MAP_ITALIC_FONT],
 *     'text-field': ['get', 'subtitle']
 *   }
 * };
 * ```
 *
 * @group Map Style
 */
export const MAP_ITALIC_FONT = 'NotoSans-MediumItalic';

/**
 * Default text size expression used in the TomTom map style.
 *
 * @remarks
 * This MapLibre expression defines zoom-dependent text sizing that scales from 12px at zoom 10
 * to 14px at zoom 16. Use this for consistent text sizing across zoom levels.
 *
 * @example
 * ```typescript
 * import { DEFAULT_TEXT_SIZE } from '@tomtom-international/maps-sdk-js/map';
 *
 * const textLayer = {
 *   type: 'symbol',
 *   layout: {
 *     'text-size': DEFAULT_TEXT_SIZE,
 *     'text-field': ['get', 'name']
 *   }
 * };
 * ```
 *
 * @group Map Style
 */
export const DEFAULT_TEXT_SIZE: ExpressionSpecification = ['interpolate', ['linear'], ['zoom'], 10, 14, 18, 16];

/**
 * Array of all available font faces in the TomTom map style.
 *
 * @remarks
 * Contains all font variants available in the map style. Useful for font selection
 * or validation when creating custom layers.
 *
 * @example
 * ```typescript
 * import { mapFonts } from '@tomtom-international/maps-sdk-js/map';
 *
 * // Check if a font is available
 * if (mapFonts.includes('Noto-Bold')) {
 *   // Use the font
 * }
 *
 * // Use as fallback list
 * const textLayer = {
 *   type: 'symbol',
 *   layout: {
 *     'text-font': [...mapFonts]
 *   }
 * };
 * ```
 *
 * @group Map Style
 */
export const mapFonts = [MAP_REGULAR_FONT, MAP_ITALIC_FONT, MAP_BOLD_FONT, MAP_MEDIUM_FONT] as const;

/**
 * Type representing valid font faces available in the TomTom map style.
 *
 * @remarks
 * Use this type to ensure type-safe font selection when working with text layers.
 * Restricts values to only the fonts available in the map style.
 *
 * @example
 * ```typescript
 * import type { MapFont } from '@tomtom-international/maps-sdk-js/map';
 *
 * function createTextLayer(font: MapFont) {
 *   return {
 *     type: 'symbol',
 *     layout: {
 *       'text-font': [font],
 *       'text-field': ['get', 'name']
 *     }
 *   };
 * }
 *
 * // Type-safe: only accepts valid map fonts
 * const layer = createTextLayer('Noto-Bold');
 * ```
 *
 * @group Map Style
 */
export type MapFont = (typeof mapFonts)[number];

/**
 * Default pin icon scale at max zoom level (zoom 22).
 * This is the icon-size scale factor - 1.0 would be the original icon size.
 * @ignore
 */
export const DEFAULT_MAX_PIN_SCALE = 0.8;

/**
 * @ignore
 */
export const PIN_ICON_SIZE: ExpressionSpecification = ['interpolate', ['linear'], ['zoom'], 8, 0.6, 22, DEFAULT_MAX_PIN_SCALE];

/**
 * @ignore
 */
export const SELECTED_PIN_ICON_SIZE: ExpressionSpecification = ['interpolate', ['linear'], ['zoom'], 8, 0.8, 22, 1];
