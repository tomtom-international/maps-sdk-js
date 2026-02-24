import type { ColorPaletteOptions } from './layers/colorPalettes';
import {
    FILLED_THEME_FILL_OPACITY,
    FILLED_THEME_LINE_COLOR,
    FILLED_THEME_LINE_OPACITY,
    FILLED_THEME_LINE_WIDTH,
    OUTLINE_THEME_FILL_OPACITY,
    OUTLINE_THEME_LINE_COLOR,
    OUTLINE_THEME_LINE_OPACITY,
    OUTLINE_THEME_LINE_WIDTH,
} from './layers/constants';
import { prepareReachableRangesForDisplay, type ReachableRangeLabelFn } from './prepareReachableRangesForDisplay';
import type { GeometriesModuleConfig } from './types/geometriesModuleConfig';
import type { GeometryTheme } from './types/geometryTheme';

/**
 * Config for themed polygon display with palette-based coloring.
 *
 * Includes data-driven expressions so each feature's `theme` property controls its
 * styling, line labels config, and positions layers below map labels.
 *
 * For reachable ranges, use {@link reachableRangeGeometryConfig} which extends this
 * with auto-generated labels.
 *
 * @param palette Color palette for polygon fills. Defaults to `'fadedRainbow'`.
 *
 * @group Geometries
 */
export const themedGeometryConfig = (palette: ColorPaletteOptions = 'fadedRainbow'): GeometriesModuleConfig => ({
    beforeLayerConfig: 'lowestLabel',
    lineConfig: {
        // outline theme: thick colored line; filled/inverted: thin grey line
        lineWidth: ['case', ['==', ['get', 'theme'], 'outline'], OUTLINE_THEME_LINE_WIDTH, FILLED_THEME_LINE_WIDTH],
        lineColor: [
            'case',
            ['==', ['get', 'theme'], 'outline'],
            ['coalesce', ['get', 'color'], OUTLINE_THEME_LINE_COLOR],
            FILLED_THEME_LINE_COLOR,
        ],
        lineOpacity: [
            'case',
            ['==', ['get', 'theme'], 'outline'],
            OUTLINE_THEME_LINE_OPACITY,
            FILLED_THEME_LINE_OPACITY,
        ],
    },
    colorConfig: {
        fillColor: palette,
        // outline theme: transparent fill; filled/inverted: semi-transparent fill
        fillOpacity: [
            'case',
            ['==', ['get', 'theme'], 'outline'],
            OUTLINE_THEME_FILL_OPACITY,
            FILLED_THEME_FILL_OPACITY,
        ],
    },
    lineLabelConfig: {},
});

/**
 * Returns a {@link GeometriesModuleConfig} for reachable ranges.
 *
 * Builds on {@link themedGeometryConfig} and overrides `transformFeaturesForDisplay` so the
 * raw output of `calculateReachableRanges` can be passed directly to {@link GeometriesModule.show}
 * — labels are derived from each feature's `budget` property.
 *
 * @param palette Color palette. Defaults to `'fadedRainbow'`.
 * @param theme Visual theme. Defaults to `'filled'`.
 * @param label Custom label generator; when omitted, labels are derived from `budget` property.
 *
 * @example
 * ```typescript
 * const module = await GeometriesModule.get(map, reachableRangeGeometryConfig());
 * const result = await calculateReachableRanges([...]);
 * module.show(result); // labels and theme applied automatically
 * ```
 *
 * @group Geometries
 */
export const reachableRangeGeometryConfig = (
    palette: ColorPaletteOptions = 'fadedRainbow',
    theme?: GeometryTheme,
    label?: ReachableRangeLabelFn,
): GeometriesModuleConfig => ({
    ...themedGeometryConfig(palette),
    // Derives budget labels (e.g. '30 min') and applies theme-specific geometry transformations.
    transformFeaturesForDisplay: (result) => prepareReachableRangesForDisplay(result, theme, label),
});
