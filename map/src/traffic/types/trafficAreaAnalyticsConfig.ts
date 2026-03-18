import type { MapModuleCommonConfig } from '../../shared';

/**
 * Available metrics for area analytics visualization.
 *
 * @group Traffic Area Analytics
 */
export type AreaAnalyticsMetricKey = 'congestionLevel' | 'speed' | 'travelTime';

/**
 * Visualization mode for area analytics data.
 *
 * - `'hexgrid'` — 3D extruded hexagonal cells colored and raised by metric value
 * - `'heatmap'` — MapLibre density heatmap layer from tile centre points
 *
 * @group Traffic Area Analytics
 */
export type AreaAnalyticsMode = 'heatmap' | 'hexgrid';

/**
 * Configuration for the Traffic Area Analytics visualization module.
 *
 * @remarks
 * Controls which visualization mode is active, which metric drives
 * the color/height, and overall layer visibility.
 *
 * @group Traffic Area Analytics
 */
export type TrafficAreaAnalyticsConfig = MapModuleCommonConfig & {
    /**
     * Controls the visibility of the area analytics layers.
     *
     * @defaultValue true
     */
    visible?: boolean;

    /**
     * Visualization mode.
     *
     * @defaultValue 'hexgrid'
     */
    mode?: AreaAnalyticsMode;

    /**
     * The traffic metric that drives color and height.
     *
     * @defaultValue 'congestionLevel'
     */
    metric?: AreaAnalyticsMetricKey;
};
