import { SVGIconStyleOptions } from '../types';
import pinSvgRaw from './pin.svg?raw';

/**
 * Helper function to parse SVG string (typically imported from ...svg?raw) to SVGElement
 * @ignore
 */
export const parseSvg = (svgString: string): SVGElement =>
    new DOMParser().parseFromString(svgString, 'image/svg+xml').documentElement as unknown as SVGElement;

// Applies `fillColor` / `outlineColor` / `outlineOpacity` overrides to an SVG
// that follows the `#background` / `#outline` id convention.
const applySvgStyleOptions = (element: SVGElement, options: SVGIconStyleOptions | undefined): SVGElement => {
    if (options?.fillColor) {
        element.querySelector('#background')?.setAttribute('fill', options.fillColor);
    }
    if (options?.outlineColor) {
        element.querySelector('#outline')?.setAttribute('fill', options.outlineColor);
    }
    if (options?.outlineOpacity !== undefined) {
        element.querySelector('#outline')?.setAttribute('fill-opacity', options.outlineOpacity.toString());
    }
    return element;
};

/**
 * @ignore
 */
export const pinSvg = (options: SVGIconStyleOptions | undefined): SVGElement =>
    applySvgStyleOptions(parseSvg(pinSvgRaw), options);
