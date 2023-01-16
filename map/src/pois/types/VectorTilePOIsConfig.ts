import { VectorTileMapModuleConfig } from "../../core";

export type VectorTilePOIsConfig = VectorTileMapModuleConfig & {
    /**
     * Whether the layers for this module are to be interactive.
     * * The user can interact with the layers from this module.
     */
    interactive?: boolean;
};
