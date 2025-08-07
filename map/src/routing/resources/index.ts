import type { StyleImageMetadata } from 'maplibre-gl';
import { isDOMImageSupported, svgToImg } from '../../shared/imageUtils';
import { parseSvg, pinSvg } from '../../shared/resources';
import circleSvgRaw from './circle.svg?raw';
import finishSvgRaw from './finish.svg?raw';
import instructionArrowSvgRaw from './instruction-line-arrow.svg?raw';
import startSvgRaw from './start.svg?raw';
import summaryMapBubbleSvgRaw from './summary-map-bubble.svg?raw';
import trafficSvgRaw from './traffic.svg?raw';

let instructionArrowIconImg: HTMLImageElement;

// defensive check for SSR
if (isDOMImageSupported()) {
    instructionArrowIconImg = svgToImg(parseSvg(instructionArrowSvgRaw));
}

/**
 * @ignore
 */
export { instructionArrowIconImg };

/**
 * @ignore
 */
export const summaryMapBubbleImg = (color: string): HTMLImageElement => {
    // defensive check for SSR and node-test environments:
    if (!isDOMImageSupported()) {
        return undefined as never as HTMLImageElement;
    }
    const svg: SVGElement = parseSvg(summaryMapBubbleSvgRaw);
    svg.querySelector('#bubble')?.setAttribute('fill', color);
    svg.querySelector('#pin')?.setAttribute('fill', color);
    return svgToImg(svg);
};

/**
 * Options to effectively stretch the summary bubble image to fit its text.
 * * They are tightly coupled with the SVG original dimensions.
 * @ignore
 */
export const summaryBubbleImageOptions: Partial<StyleImageMetadata> = {
    pixelRatio: 2,
    stretchX: [
        [20, 45],
        [100, 130],
    ],
    stretchY: [[20, 35]],
    content: [10, 10, 130, 45],
};

/**
 * @ignore
 * @param color
 */
export const trafficImg = (color: string): HTMLImageElement => {
    // defensive check for SSR and node-test environments:
    if (!isDOMImageSupported()) {
        return undefined as never as HTMLImageElement;
    }
    const svg: SVGElement = parseSvg(trafficSvgRaw);
    const main = svg.querySelector('#main') as Element;
    main.setAttribute('transform', 'scale(2)');
    main.setAttribute('fill', color);
    return svgToImg(svg);
};

/**
 * @ignore
 */
export const waypointIcon = (foregroundSvg?: SVGElement): HTMLImageElement => {
    // defensive check for SSR and node-test environments:
    if (!isDOMImageSupported()) {
        return undefined as never as HTMLImageElement;
    }
    const svg = pinSvg();
    if (foregroundSvg) {
        svg.appendChild(foregroundSvg);
    }
    return svgToImg(svg);
};

/**
 * @ignore
 */
export const waypointStartIcon = (): HTMLImageElement => {
    // defensive check for SSR and node-test environments:
    if (!isDOMImageSupported()) {
        return undefined as never as HTMLImageElement;
    }
    return waypointIcon(parseSvg(startSvgRaw));
};

/**
 * @ignore
 */
export const waypointFinishIcon = (): HTMLImageElement => {
    // defensive check for SSR and node-test environments:
    if (!isDOMImageSupported()) {
        return undefined as never as HTMLImageElement;
    }
    return waypointIcon(parseSvg(finishSvgRaw));
};

/**
 * @ignore
 */
export const softWaypointIcon = (): HTMLImageElement => {
    // defensive check for SSR and node-test environments:
    if (!isDOMImageSupported()) {
        return undefined as never as HTMLImageElement;
    }
    return svgToImg(parseSvg(circleSvgRaw));
};
