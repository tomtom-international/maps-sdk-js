/**
 * ID of the sprite holding the large POI pin images. It is added to the style *next to* the
 * sprite the style already ships (base map icons, road shields, traffic), which MapLibre keeps
 * under the reserved `default` ID.
 * @ignore
 */
export const PIN_CATEGORIES_SPRITE_ID = 'pinCategories';

/**
 * Namespaces an image ID of the pin categories sprite. MapLibre prefixes the images of every
 * sprite other than `default` with their sprite ID, so an image of that sprite is only found
 * under `pinCategories:<image ID>`.
 * @ignore
 */
export const toPinSpriteImageID = (imageID: string): string => `${PIN_CATEGORIES_SPRITE_ID}:${imageID}`;

/**
 * @ignore
 */
export const isDOMImageSupported = (): boolean =>
    typeof document != 'undefined' && typeof DOMParser != 'undefined' && typeof btoa != 'undefined';

/**
 * @ignore
 */
export const svgToImg = (svgDomElement: SVGElement): HTMLImageElement => {
    if (!isDOMImageSupported()) {
        return undefined as never as HTMLImageElement;
    }
    const img = document.createElement('img');
    img.src = `data:image/svg+xml;base64,${btoa(new XMLSerializer().serializeToString(svgDomElement))}`;
    return img;
};
