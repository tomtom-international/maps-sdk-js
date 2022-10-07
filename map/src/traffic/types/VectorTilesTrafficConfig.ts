import { MapModuleConfig } from "../../core";

/**
 * Configuration for vector tiles traffic incidents and flow layers.
 */
export type VectorTilesTrafficConfig = MapModuleConfig & {
    incidents?: {
        visible?: boolean;
        icons?: { visible: boolean };
    };
    flow?: {
        visible: boolean;
    };
};
