import { VectorTileMapModuleConfig } from "../../core";

/**
 * Configuration for vector tiles traffic incidents and flow layers.
 */
export type VectorTilesTrafficConfig = VectorTileMapModuleConfig & {
    incidents?: {
        visible?: boolean;
        icons?: { visible: boolean };
    };
    flow?: {
        visible: boolean;
    };
};
