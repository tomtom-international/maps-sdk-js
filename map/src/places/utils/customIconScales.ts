import { suffixNumber } from '../../shared/layers/utils';
import { parseSvg } from '../../shared/resources';
import type { PlacesModuleConfig, PlacesTheme } from '../types/placesModuleConfig';

/**
 * Map of icon IDs to their text offset scale factors.
 * @ignore
 */
export type IconScalesMap = Map<string, { heightScale: number; widthScale: number }>;

/**
 * Default pin dimensions (from base pin.svg)
 */
const DEFAULT_PIN_HEIGHT_PX = 140;
const DEFAULT_PIN_WIDTH_PX = 120;

/**
 * Default base-map POI icon dimensions (from base-theme POI icons)
 */
const DEFAULT_MAP_POI_HEIGHT_PX = 54;
const DEFAULT_MAP_POI_WIDTH_PX = 54;

/**
 * Extracts dimensions from an SVG string or HTMLImageElement.
 * For SVGs, parses the viewBox or width/height attributes.
 * For images, uses naturalWidth/naturalHeight.
 * @ignore
 */
export const extractImageDimensions = (image: string | HTMLImageElement): { width: number; height: number } | null => {
    try {
        if (typeof image === 'string') {
            if (image.includes('<svg')) {
                // Parse SVG to extract dimensions
                const svgElement = parseSvg(image);

                // Try viewBox first (format: "minX minY width height")
                const viewBox = svgElement.getAttribute('viewBox');
                if (viewBox) {
                    const parts = viewBox.split(/\s+/);
                    if (parts.length === 4) {
                        return {
                            width: Number.parseFloat(parts[2]),
                            height: Number.parseFloat(parts[3]),
                        };
                    }
                }

                // Fallback to width/height attributes
                const width = svgElement.getAttribute('width');
                const height = svgElement.getAttribute('height');
                if (width && height) {
                    return {
                        width: Number.parseFloat(width),
                        height: Number.parseFloat(height),
                    };
                }
            }
            // For URL strings, we can't extract dimensions synchronously
            return null;
        } else {
            // HTMLImageElement - check if loaded
            if (image.complete && image.naturalWidth > 0) {
                return {
                    width: image.naturalWidth,
                    height: image.naturalHeight,
                };
            }
            return null;
        }
    } catch (error) {
        console.warn('Failed to extract image dimensions:', error);
        return null;
    }
};

/**
 * Calculate the scale factors for a custom icon based on its dimensions relative to standard icon sizes.
 *
 * Calculates both height and width scales independently:
 * - Height scale is used for vertical text offset
 * - Width scale is used for horizontal text offset
 *
 *
 * @param image The image to extract dimensions from
 * @param theme The places theme ('base-map' for circles, 'pin' for pins)
 * @returns Object with heightScale and widthScale, or undefined if icon is standard-sized (within tolerance)
 * @ignore
 */
export const calculateIconScale = (
    image: string | HTMLImageElement | undefined,
    theme?: PlacesTheme,
): { heightScale: number; widthScale: number } | undefined => {
    if (!image) {
        return undefined;
    }

    const dimensions = extractImageDimensions(image);
    if (!dimensions) {
        return undefined;
    }

    const isBaseMapTheme = theme === 'base-map';

    // For base-map theme, we need to scale relative to POI icons
    if (isBaseMapTheme) {
        const heightScale = dimensions.height / DEFAULT_MAP_POI_HEIGHT_PX;
        const widthScale = dimensions.width / DEFAULT_MAP_POI_WIDTH_PX;

        return { heightScale, widthScale };
    } else {
        // For pin theme, check if it's different from default pin
        const heightScale = dimensions.height / DEFAULT_PIN_HEIGHT_PX;
        const widthScale = dimensions.width / DEFAULT_PIN_WIDTH_PX;

        return { heightScale, widthScale };
    }
};

/**
 * Builds a map of icon IDs to their text offset scales for custom icons.
 * @ignore
 */
export const buildCustomIconScalesMap = (
    config: PlacesModuleConfig | undefined,
    instanceIndex: number,
): IconScalesMap => {
    const iconTextOffsetScales = new Map<string, { heightScale: number; widthScale: number }>();
    const customIcons = config?.icon?.categoryIcons ?? [];

    for (const icon of customIcons) {
        if (icon.image) {
            const scales = calculateIconScale(icon.image, config?.theme);
            if (scales !== undefined) {
                // Base icon ID with instance suffix
                const suffixedIconId = suffixNumber(icon.id, instanceIndex);
                iconTextOffsetScales.set(suffixedIconId, scales);

                // If this icon has an availability level, also add the availability-suffixed version
                // (e.g., "ELECTRIC_VEHICLE_STATION-available-0")
                if (icon.availabilityLevel) {
                    const availabilitySuffixedId = suffixNumber(`${icon.id}-${icon.availabilityLevel}`, instanceIndex);
                    iconTextOffsetScales.set(availabilitySuffixedId, scales);
                }
            }
        }
    }

    return iconTextOffsetScales;
};
