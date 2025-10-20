import type { StyleModuleConfig } from '../../shared';

/**
 * Configuration options for the HillshadeModule.
 *
 * Controls the appearance and visibility of terrain shading on the map.
 * Extends {@link StyleModuleConfig} with hillshade-specific settings.
 *
 * @remarks
 * The HillshadeModule uses vector tile elevation data to create shadow/highlight
 * effects that enhance the 3D perception of terrain features like mountains and valleys.
 *
 * **Configuration Options:**
 * All options are inherited from StyleModuleConfig:
 * - `visible`: Whether the hillshade layer is shown or hidden
 *
 * **Visual Effect:**
 * - Creates realistic terrain depth perception
 * - Lightweight performance impact
 * - Works alongside other map layers
 *
 * @example
 * ```typescript
 * // Show hillshade
 * const config: HillshadeModuleConfig = {
 *   visible: true
 * };
 *
 * // Hide hillshade initially
 * const hiddenConfig: HillshadeModuleConfig = {
 *   visible: false
 * };
 * ```
 *
 * @group Map Modules
 * @category Types
 */
export type HillshadeModuleConfig = StyleModuleConfig;
