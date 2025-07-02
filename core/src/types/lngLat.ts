/**
 * The way we treat available entry points when referring to the position of a place or waypoint.
 * * main-when-available: if available, the main entry point will be used, otherwise the default position of the place.
 * * ignore: the default position of the place will be used.
 */
export type GetPositionEntryPointOption = 'main-when-available' | 'ignore';

/**
 * Options for the getPosition call to further control the extraction of the position.
 */
export type GetPositionOptions = {
    /**
     * Returns the position of the main entry point of the given place if available, otherwise returns the default position of the place.
     * * This can be useful for routing.
     * @default ignore
     */
    useEntryPoint?: GetPositionEntryPointOption;
};
