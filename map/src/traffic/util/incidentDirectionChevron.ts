/**
 * Direction chevron sprite for {@link TrafficIncidentOverlayModule}.
 *
 * A single right-pointing chevron, rasterised from SVG and registered via
 * `map.addImage()`. Referenced as a `line-pattern` on a line layer stacked on top
 * of `-inner-solid` — transparent pixels let the magnitude colour show through,
 * opaque strokes paint the direction indicator.
 *
 * Because REST LineStrings arrive in travel order, MapLibre tiles the pattern
 * along that direction automatically; no per-feature rotation needed. A dark halo
 * under the white stroke keeps the chevron legible on all three jam tints
 * (yellow `minor`, orange `moderate`, red `major`).
 *
 * @module
 * @ignore
 */
import { isDOMImageSupported, svgToImg } from '../../shared/imageUtils';
import { parseSvg } from '../../shared/resources';

export const INCIDENT_DIRECTION_CHEVRON_IMAGE_ID = 'tt-traffic-incident-direction-chevron';

/**
 * Rasterised chevron, memoised. Returns `undefined` in non-DOM environments
 * (node-only unit tests); callers should skip sprite registration in that case.
 * @ignore
 */
export const getIncidentDirectionChevronImage = (): HTMLImageElement | undefined => {
    if (!isDOMImageSupported()) return undefined;
    if (!cachedImg) cachedImg = svgToImg(parseSvg(svgMarkup));
    return cachedImg;
};

const svgMarkup = `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="18" viewBox="0 0 48 18">
<path d="M 18 4 L 30 9 L 18 14" fill="none" stroke="rgba(20, 30, 50, 0.5)" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M 18 4 L 30 9 L 18 14" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

let cachedImg: HTMLImageElement | undefined;
