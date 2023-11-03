export type MapEventsConfig = {
    /**
     * Defines the event coordinates precision mode.
     * * box: features are queried within the padding box.
     * * point: features are queried at the specific event point. Makes paddingBox irrelevant.
     * * point-then-box: first the features are queried at the specific event point. If none returned, then they're queried within the padding box.
     * @default box
     */
    precisionMode?: "box" | "point" | "point-then-box";
    /**
     * Optional padding box to be inserted around the event point, in pixels.
     * * Ignored if precisionMode is set to "point".
     *  @default 5
     */
    paddingBox?: number;
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
     * Delay to trigger a long-hover event when map has just moved (milliseconds).
     * * Right after the map has moved, the first long-hover is by default going to wait longer,
     * to prevent unwanted hovers while panning the map.
     * * Should be higher than longHoverDelayOnStillMapMS.
     * @default 800
     */
    longHoverDelayAfterMapMoveMS?: number;
    /**
     * Delay to trigger a long-hover event when map was still since the last long hover (milliseconds).
     * @default 300
     */
    longHoverDelayOnStillMapMS?: number;
};
