import type { StyleImageMetadata } from 'maplibre-gl';
import { isDOMImageSupported, svgToImg } from '../../shared/imageUtils';
import circleSvg from './circle.svg';
import finishSvg from './finish.svg';
import instructionArrowSvg from './instruction-line-arrow.svg';
import pinSvg from './pin.svg';
import startSvg from './start.svg';
import summaryMapBubbleSvg from './summary-map-bubble.svg';
import trafficSvg from './traffic.svg';

let instructionArrowIconImg: HTMLImageElement;

// defensive check for SSR
if (isDOMImageSupported()) {
    instructionArrowIconImg = svgToImg(instructionArrowSvg());
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
    const svg: SVGElement = summaryMapBubbleSvg();
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
    const svg: SVGElement = trafficSvg();
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
    return waypointIcon(startSvg());
};

/**
 * @ignore
 */
export const waypointFinishIcon = (): HTMLImageElement => {
    // defensive check for SSR and node-test environments:
    if (!isDOMImageSupported()) {
        return undefined as never as HTMLImageElement;
    }
    return waypointIcon(finishSvg());
};

/**
 * @ignore
 */
export const softWaypointIcon = (): HTMLImageElement => {
    // defensive check for SSR and node-test environments:
    if (!isDOMImageSupported()) {
        return undefined as never as HTMLImageElement;
    }
    return svgToImg(circleSvg());
};
