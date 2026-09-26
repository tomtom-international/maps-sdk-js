import type { MapModuleCommonConfig } from '../../shared';

/**
 * Configuration of the {@link TerrainModule}: the two ways it draws the relief of the style's
 * elevation data.
 *
 * @remarks
 * Unset, the hillshade is hidden like the other style parts the SDK adds (traffic flow and
 * incidents), and the surface is left as the map draws it: flat on TomTom styles. So
 * `resetConfig()` returns a TomTom style to flat and unshaded.
 *
 * @example
 * ```typescript
 * const config: TerrainModuleConfig = { hillshade: true, elevation: true, elevationExaggeration: 1.5 };
 * ```
 *
 * @group Terrain
 */
export type TerrainModuleConfig = MapModuleCommonConfig & {
    /**
     * Shows the hillshade: light and shadow on the map surface that reveal hills, valleys and
     * mountains, at any camera pitch. Its look is set by the `hillshade.*` knobs of {@link StylingModule}.
     *
     * @default false
     */
    hillshade?: boolean;

    /**
     * Raises the map surface to the elevation data in 3D, or flattens it. Shows best with a
     * pitched camera.
     *
     * @default The map's own terrain, if its style or MapLibre code raised one; none on TomTom styles.
     */
    elevation?: boolean;

    /**
     * Vertical scaling of the 3D surface: `1` is true elevation, higher values emphasise the
     * relief. Kept while `elevation` is off, so turning it back on restores it.
     *
     * @default 1
     */
    elevationExaggeration?: number;
};
