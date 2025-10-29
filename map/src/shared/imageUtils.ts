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
