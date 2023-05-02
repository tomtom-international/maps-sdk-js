export type StyleModuleInitConfig = {
    /**
     * If **true**, it will make sure the module sources and layers are added to the style before the module is initialized.
     * * If it was not in the style, it will **reload the style** with the missing parts in it.
     * * This can be useful if you didn't need the module upfront and wanted a faster map initialization.
     * * WARNING: If you added your own custom sources and layers to the style,
     * you need to listen to the style change and add them again.
     *
     * If **false** and not in the style, the module initialization will typically throw an error,
     * hinting you to include that in the style when loading the map earlier.
     * @default false
     */
    ensureAddedToStyle?: boolean;
};

/**
 * Base type for all Maps SDK style-based map modules
 * (usually based on vector tile sources present in the loaded map style).
 */
export type StyleModuleConfig = {
    /**
     * Whether the layers for this module are to be visible.
     */
    visible?: boolean;
};
