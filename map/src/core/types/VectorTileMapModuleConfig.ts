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
     * That means the layers can be listen to events
     */
    interactive?: boolean;
};
