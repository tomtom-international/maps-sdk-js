/**
 * Base type for all GO SDK map modules.
 */
export type MapModuleConfig = {
    /**
     * Whether the layers for this module are to be visible.
     */
    visible?: boolean;
    [key: string]: unknown;
};
