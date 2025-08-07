import pinSvgRaw from '../../shared/resources/pin.svg?raw';

/**
 * Helper function to parse SVG string (typically imported from ...svg?raw) to SVGElement
 * @ignore
 */
export const parseSvg = (svgString: string): SVGElement =>
    new DOMParser().parseFromString(svgString, 'image/svg+xml').documentElement as unknown as SVGElement;

/**
 * @ignore
 */
export const pinSvg = () => parseSvg(pinSvgRaw);
