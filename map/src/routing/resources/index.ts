import type { StyleImageMetadata } from 'maplibre-gl';
import { SVGIconStyleOptions } from '../../shared';
import { isDOMImageSupported, svgToImg } from '../../shared/imageUtils';
import { parseSvg, pinSvg } from '../../shared/resources';
import type { SpeedLimitSignFace } from '../types/routeSections';
import finishSvgRaw from './finish.svg?raw';
import instructionArrowSvgRaw from './instruction-line-arrow.svg?raw';
import speedLimitDiscSvgRaw from './speed-limit-disc.svg?raw';
import speedLimitDiscYellowSvgRaw from './speed-limit-disc-yellow.svg?raw';
import speedLimitPlaqueSvgRaw from './speed-limit-plaque.svg?raw';
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

const SPEED_LIMIT_SIGN_SVGS: Record<SpeedLimitSignFace, string> = {
    whiteDisc: speedLimitDiscSvgRaw,
    yellowDisc: speedLimitDiscYellowSvgRaw,
    plaque: speedLimitPlaqueSvgRaw,
};

/**
 * The speed limit sign faces: the white disc most of Europe posts on, the yellow one the Nordics
 * use, and the upright plaque of the United States. The number is part of none of them — it is
 * drawn over the face as text — so one image serves every limit a route carries.
 * @ignore
 */
export const speedLimitSignImg = (face: SpeedLimitSignFace): HTMLImageElement => {
    // defensive check for SSR and node-test environments:
    if (!isDOMImageSupported()) {
        return undefined as never as HTMLImageElement;
    }
    return svgToImg(parseSvg(SPEED_LIMIT_SIGN_SVGS[face]));
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
export const waypointIcon = (
    foregroundSvg: SVGElement | undefined,
    svgOptions: SVGIconStyleOptions | undefined,
): HTMLImageElement => {
    // defensive check for SSR and node-test environments:
    if (!isDOMImageSupported()) {
        return undefined as never as HTMLImageElement;
    }
    const svg = pinSvg(svgOptions);
    if (foregroundSvg) {
        svg.appendChild(foregroundSvg);
    }
    return svgToImg(svg);
};

/**
 * @ignore
 */
export const waypointStartIcon = (svgOptions: SVGIconStyleOptions | undefined): HTMLImageElement => {
    // defensive check for SSR and node-test environments:
    if (!isDOMImageSupported()) {
        return undefined as never as HTMLImageElement;
    }
    return waypointIcon(parseSvg(startSvgRaw), svgOptions);
};

/**
 * @ignore
 */
export const waypointFinishIcon = (svgOptions: SVGIconStyleOptions | undefined): HTMLImageElement => {
    // defensive check for SSR and node-test environments:
    if (!isDOMImageSupported()) {
        return undefined as never as HTMLImageElement;
    }
    return waypointIcon(parseSvg(finishSvgRaw), svgOptions);
};
