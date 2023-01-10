/**
 * Base type for all GO SDK vector tile map modules.
 */
export type VectorTileMapModuleConfig = {
    /**
     * Whether the layers for this module are to be visible.
     */
    visible?: boolean;
    /**
     * Whether the layers for this module are to be interactive.
     * * The user can interact with the layers from this module.
     */
    interactive?: boolean;
};
