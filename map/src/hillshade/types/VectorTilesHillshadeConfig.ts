import { VectorTileMapModuleConfig } from "../../shared";

export type VectorTilesHillshadeConfig = VectorTileMapModuleConfig & {
    /**
     * Whether the layers for this module are to be interactive.
     * * The user can interact with the layers from this module.
     * @default true
     */
    interactive?: boolean;
};
