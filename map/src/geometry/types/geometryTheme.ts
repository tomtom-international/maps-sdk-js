/**
 * Visual theme for polygon display with {@link GeometriesModule}.
 *
 * - `'filled'`   — Colored fill with thin border (default)
 * - `'outline'`  — Transparent fill with thick colored border
 * - `'inverted'` — Colors the area **outside** the polygon (donut geometry)
 *
 * Set via {@link GeometriesModuleConfig.theme} at config level, or per-feature in
 * `properties.theme`.
 *
 * @group Geometries
 */
export type GeometryTheme = 'filled' | 'outline' | 'inverted';

/**
 * All valid {@link GeometryTheme} values.
 *
 * @group Geometries
 */
export const geometryThemes = ['filled', 'outline', 'inverted'] as const;
