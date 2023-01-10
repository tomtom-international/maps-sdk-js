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
     * Check out {@link https://developer.mozilla.org/en-US/docs/Web/CSS/cursor}
     * @default pointer
     */
    cursorOnHover?: string;
    /**
     * Optional configuration to show custom cursor when clicking
     * Check out {@link https://developer.mozilla.org/en-US/docs/Web/CSS/cursor}
     * @default grabbing
     */
    cursorOnMouseDown?: string;
    /**
     * Optional configuration to show custom cursor on map
     * Check out {@link https://developer.mozilla.org/en-US/docs/Web/CSS/cursor}
     * @default default
     */
    cursorOnMap?: string;
    /**
     * Optional configuration to delay hover when map moves (milliseconds).
     * @default 800
     */
    hoverDelayMsOnMapMove?: number;
    /**
     * Optional configuration to delay hover when map stops (milliseconds).
     * @default 300
     */
    hoverDelayMsOnMapStop?: number;
};
