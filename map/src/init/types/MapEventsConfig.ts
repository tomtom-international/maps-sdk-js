export type MapEventsConfig = {
    /**
     * Optional padding box to be inserted on the click area
     *  @default 5
     */
    paddingBox?: number;
    /**
     * Optional configuration to update paddingBox depending on zoom level
     * @default true
     */
    paddingBoxUpdateOnZoom?: boolean;
    /**
     * Optional configuration to show custom cursor when hovering
     * * Check out {@link https://developer.mozilla.org/en-US/docs/Web/CSS/cursor}
     * @default pointer
     */
    cursorOnHover?: string;
    /**
     * Optional configuration to show custom cursor when clicking
     * * Check out {@link https://developer.mozilla.org/en-US/docs/Web/CSS/cursor}
     * @default grabbing
     */
    cursorOnMouseDown?: string;
    /**
     * Optional configuration to show custom cursor on map
     * * Check out {@link https://developer.mozilla.org/en-US/docs/Web/CSS/cursor}
     * @default default
     */
    cursorOnMap?: string;
    /**
     * Optional configuration to delay long-hover when map has just moved (milliseconds).
     * * Right after the map has moved, the first long-hover is by default going to wait longer,
     * to prevent unwanted hovers while panning the map
     * @default 800
     */
    hoverDelayMsAfterMapMove?: number;
    /**
     * Optional configuration to delay long-hover when map was still since the last long hover (milliseconds).
     * @default 300
     */
    hoverDelayMsOnStillMap?: number;
};
