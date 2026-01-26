import { parseSvg } from '../../shared/resources';
import { suffixNumber } from '../../shared/layers/utils';
import type { PlacesModuleConfig } from '../types/placesModuleConfig';

/**
 * Map of icon IDs to their text offset scale factors.
 * @ignore
 */
export type IconScalesMap = Map<string, number>;

/**
 * Default pin dimensions (from base pin.svg)
 * @ignore
 */
const DEFAULT_PIN_HEIGHT = 140;

/**
 * Typical POI icon height in base-map theme (rough estimate based on common sprites)
 * @ignore
 */
const BASE_MAP_POI_HEIGHT = 28;

/**
 * Extracts dimensions from an SVG string or HTMLImageElement.
 * For SVGs, parses the viewBox or width/height attributes.
 * For images, uses naturalWidth/naturalHeight.
 * @ignore
 */
export const extractImageDimensions = (
    image: string | HTMLImageElement,
): { width: number; height: number } | null => {
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
 * Calculate the scale factor for a custom icon based on its dimensions relative to standard icon sizes.
 * @param image The image to extract dimensions from
 * @param useBaseMapReference If true, uses base-map POI height as reference (for theme: 'base-map')
 * @ignore
 */
export const calculateIconScale = (
    image: string | HTMLImageElement | undefined,
    isBaseMapTheme = false,
): number | undefined => {
    if (!image) {
        return undefined;
    }
    
    const dimensions = extractImageDimensions(image);
    if (!dimensions) {
        return undefined;
    }
    
    // For base-map theme, we need to scale relative to POI icons 
    if (isBaseMapTheme) {
        const scale = dimensions.height / BASE_MAP_POI_HEIGHT;
        
        // Return for standard-sized POI icons (within 20% tolerance)
        if (Math.abs(scale - 1) < 0.2) {
            return undefined;
        }
        
        return scale;
    } else {
        // For pin theme, check if it's different from default pin
        const scale = dimensions.height / DEFAULT_PIN_HEIGHT;
        
        // Return for standard pin size (within 5% tolerance)
        if (Math.abs(scale - 1) < 0.05) {
            return undefined;
        }
        
        return scale;
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
    const iconTextOffsetScales = new Map<string, number>();
    const customIcons = config?.icon?.categoryIcons ?? [];
    const isBaseMapTheme = config?.theme === 'base-map';

    for (const icon of customIcons) {
        if (icon.image) {
            const scale = calculateIconScale(icon.image, isBaseMapTheme);
            if (scale !== undefined) {
                // Base icon ID with instance suffix
                const suffixedIconId = suffixNumber(icon.id, instanceIndex);
                iconTextOffsetScales.set(suffixedIconId, scale);

                // If this icon has an availability level, also add the availability-suffixed version
                // (e.g., "ELECTRIC_VEHICLE_STATION-available-0")
                if (icon.availabilityLevel) {
                    const availabilitySuffixedId = suffixNumber(`${icon.id}-${icon.availabilityLevel}`, instanceIndex);
                    iconTextOffsetScales.set(availabilitySuffixedId, scale);
                }
            }
        }
    }

    return iconTextOffsetScales;
};
