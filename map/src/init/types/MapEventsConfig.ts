export type MapEventsConfig = {
    /**
     * Optional padding box to be inserted on the click area
     *
     *  Default value: 5
     */
    paddingBox?: number;
    /**
     * Optional configuration to update paddingBox depending on zoom level
     *
     * Default value: true
     */
    paddingBoxUpdateOnZoom?: boolean;
    /**
     * Optional configuration to show custom cursor when hovering
     * See: https://developer.mozilla.org/en-US/docs/Web/CSS/cursor
     *
     * Default value: pointer
     */
    cursorOnHover?: string;
    /**
     * Optional configuration to show custom cursor when clicking
     * See: https://developer.mozilla.org/en-US/docs/Web/CSS/cursor
     *
     * Default value: grabbing
     */
    cursorOnMouseDown?: string;
    /**
     * Optional configuration to show custom cursor on map
     * See: https://developer.mozilla.org/en-US/docs/Web/CSS/cursor
     *
     * Default value: default
     */
    cursorOnMap?: string;
    /**
     * Optional configuration to delay hover when map moves.
     *
     * Default value: 800 (ms)
     */
    hoverDelayOnMapMove?: number;
    /**
     * Optional configuration to delay hover when map stops.
     *
     * Default value: 300 (ms)
     */
    hoverDelayOnMapStop?: number;
};
