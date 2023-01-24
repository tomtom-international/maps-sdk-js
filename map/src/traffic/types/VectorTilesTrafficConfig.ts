import { VectorTileMapModuleConfig } from "../../core";

/**
 * Configuration for vector tiles traffic incidents and flow layers.
 */
export type VectorTilesTrafficConfig = VectorTileMapModuleConfig & {
    incidents?: {
        visible?: boolean;
        interactive?: boolean;
        icons?: { visible: boolean; interactive?: boolean };
    };
    flow?: {
        visible: boolean;
        interactive?: boolean;
    };
};
