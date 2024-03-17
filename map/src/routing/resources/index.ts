import instructionArrowSVG from "./instruction-line-arrow.svg";
import trafficSVG from "./traffic.svg";
import summaryMapBubbleSVG from "./summary-map-bubble.svg";
import { isDOMImageSupported, svgToImg } from "../../shared/imageUtils";
import type { StyleImageMetadata } from "maplibre-gl";

let instructionArrowIconImg: HTMLImageElement;

// defensive check for SSR
if (isDOMImageSupported()) {
    instructionArrowIconImg = svgToImg(instructionArrowSVG());
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
    const svg: SVGElement = summaryMapBubbleSVG();
    svg.querySelector("#bubble")!.setAttribute("fill", color);
    svg.querySelector("#pin")!.setAttribute("fill", color);
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
        [100, 130]
    ],
    stretchY: [[20, 35]],
    content: [10, 10, 130, 45]
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
    const svg: SVGElement = trafficSVG();
    const main = svg.querySelector("#main") as Element;
    main.setAttribute("transform", "scale(2)");
    main.setAttribute("fill", color);
    return svgToImg(svg);
};
