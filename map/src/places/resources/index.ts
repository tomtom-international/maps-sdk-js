import { isDOMImageSupported, svgToImg } from '../../shared/imageUtils';
import { pinSvg } from '../../shared/resources';

/**
 * Default pin for selected images without a specific category on it.
 * @ignore
 */
export const defaultPin = (): HTMLImageElement => {
    // defensive check for SSR and node-test environments:
    if (!isDOMImageSupported()) {
        return undefined as never as HTMLImageElement;
    }
    return svgToImg(pinSvg(undefined));
};
