import type { BBox } from '@tomtom-org/maps-sdk/core';
import type { Position } from 'geojson';
import type { Map } from 'maplibre-gl';
import type { TomTomMap } from '../TomTomMap';
import type {
    CalculateFittingBBoxOptions,
    CalculateMapBoundsOptions,
    CalculateMapCenterOptions,
} from './types/paddedBounds';

// (Originally mostly AI-generated)

type BoundsPX = {
    left: number;
    top: number;
    right: number;
    bottom: number;
};

const getRelativeElementBounds = (elementRect: DOMRect, containerRect: DOMRect): BoundsPX => ({
    left: elementRect.left - containerRect.left,
    top: elementRect.top - containerRect.top,
    right: elementRect.right - containerRect.left,
    bottom: elementRect.bottom - containerRect.top,
});

const isElementOutsideContainer = (bounds: BoundsPX, containerWidth: number, containerHeight: number): boolean =>
    bounds.right <= 0 || bounds.left >= containerWidth || bounds.bottom <= 0 || bounds.top >= containerHeight;

// Adjusts the current visible bounds to account for a horizontal bar element (that spans the whole width)
const adjustForHorizontalBar = (
    bounds: BoundsPX,
    currentVisible: BoundsPX, // will be mutated
    containerHeight: number,
    padding: number,
): void => {
    const distanceFromTop = bounds.top;
    const distanceFromBottom = containerHeight - bounds.bottom;
    if (distanceFromTop <= distanceFromBottom) {
        currentVisible.top = Math.max(currentVisible.top, bounds.bottom + padding);
    } else {
        currentVisible.bottom = Math.min(currentVisible.bottom, bounds.top - padding);
    }
};

// Adjusts the current visible bounds to account for a vertical bar element (that spans the whole height)
const adjustForVerticalBar = (
    bounds: BoundsPX,
    currentVisible: BoundsPX, // will be mutated
    containerWidth: number,
    padding: number,
): void => {
    const distanceFromLeft = bounds.left;
    const distanceFromRight = containerWidth - bounds.right;
    if (distanceFromLeft <= distanceFromRight) {
        currentVisible.left = Math.max(currentVisible.left, bounds.right + padding);
    } else {
        currentVisible.right = Math.min(currentVisible.right, bounds.left - padding);
    }
};

// Adjusts the current visible bounds to account for a floating element (that does not span full width or height)
const adjustForFloatingElement = (
    bounds: BoundsPX,
    currentVisible: BoundsPX, // will be mutated
    containerWidth: number,
    containerHeight: number,
    padding: number,
): void => {
    const distanceFromLeft = bounds.left;
    const distanceFromRight = containerWidth - bounds.right;
    const distanceFromTop = bounds.top;
    const distanceFromBottom = containerHeight - bounds.bottom;
    const minDistance = Math.min(distanceFromLeft, distanceFromRight, distanceFromTop, distanceFromBottom);

    if (minDistance === distanceFromLeft) {
        currentVisible.left = Math.max(currentVisible.left, bounds.right + padding);
    } else if (minDistance === distanceFromRight) {
        currentVisible.right = Math.min(currentVisible.right, bounds.left - padding);
    } else if (minDistance === distanceFromTop) {
        currentVisible.top = Math.max(currentVisible.top, bounds.bottom + padding);
    } else {
        currentVisible.bottom = Math.min(currentVisible.bottom, bounds.top - padding);
    }
};

const adjustVisibleBoundsForElement = (
    bounds: BoundsPX,
    currentVisible: BoundsPX, // will be mutated
    containerWidth: number,
    containerHeight: number,
    padding: number,
): void => {
    // Calculate distances from element to each edge of the container
    const distanceFromLeft = bounds.left;
    const distanceFromRight = containerWidth - bounds.right;
    const distanceFromTop = bounds.top;
    const distanceFromBottom = containerHeight - bounds.bottom;

    // Determine if the element spans the full width or height of the container
    const spansFullWidth = distanceFromLeft === 0 && distanceFromRight === 0;
    const spansFullHeight = distanceFromTop === 0 && distanceFromBottom === 0;

    // For elements spanning full width (horizontal bars), only consider vertical adjustment
    if (spansFullWidth && !spansFullHeight) {
        adjustForHorizontalBar(bounds, currentVisible, containerHeight, padding);
        return;
    }

    // For elements spanning full height (vertical bars), only consider horizontal adjustment
    if (spansFullHeight && !spansFullWidth) {
        adjustForVerticalBar(bounds, currentVisible, containerWidth, padding);
        return;
    }

    // For other elements, find the minimum distance to determine which edge the element is closest to
    adjustForFloatingElement(bounds, currentVisible, containerWidth, containerHeight, padding);
};

/**
 * Resolves a surrounding element reference to an HTMLElement.
 * If the reference is a string, it's treated as a DOM selector.
 * @param ref - Either an HTMLElement or a DOM selector string
 * @returns The resolved HTMLElement, or null if not found
 */
const toElement = (ref: HTMLElement | string): HTMLElement | null => {
    if (typeof ref === 'string') {
        return document.querySelector(ref);
    }
    return ref;
};

/**
 * Resolves a map reference to a MapLibre Map instance.
 * If the reference is a TomTomMap, it extracts the underlying mapLibreMap.
 * @param map - Either a TomTomMap or a MapLibre Map instance
 * @returns The MapLibre Map instance
 */
const getMapLibreMap = (map: TomTomMap | Map): Map => {
    if ('mapLibreMap' in map) {
        return map.mapLibreMap;
    }
    return map;
};

type VisibleAreaResult = {
    visibleAreaBounds: BoundsPX;
    containerWidth: number;
    containerHeight: number;
} | null;

/**
 * Calculates the visible area bounds in pixel coordinates after accounting for
 * surrounding UI elements and padding.
 */
const calculateVisibleAreaBounds = (
    map: TomTomMap | Map,
    surroundingElements: (HTMLElement | string)[],
    paddingPX: number,
): VisibleAreaResult => {
    const mapLibreMap = getMapLibreMap(map);
    const container = mapLibreMap.getContainer();
    const containerRect = container.getBoundingClientRect();
    const { width: containerWidth, height: containerHeight } = containerRect;

    // Initialize visible bounds with padding applied to all edges (will be mutated)
    const visibleAreaBounds: BoundsPX = {
        left: paddingPX,
        top: paddingPX,
        right: containerWidth - paddingPX,
        bottom: containerHeight - paddingPX,
    };

    for (const elementRef of surroundingElements) {
        const element = toElement(elementRef);
        if (!element) {
            continue;
        }
        const elementRect = element.getBoundingClientRect();
        const elementBounds = getRelativeElementBounds(elementRect, containerRect);

        if (isElementOutsideContainer(elementBounds, containerWidth, containerHeight)) {
            continue;
        }

        adjustVisibleBoundsForElement(elementBounds, visibleAreaBounds, containerWidth, containerHeight, paddingPX);
    }

    if (visibleAreaBounds.left >= visibleAreaBounds.right || visibleAreaBounds.top >= visibleAreaBounds.bottom) {
        return null;
    }

    return { visibleAreaBounds, containerWidth, containerHeight };
};

/**
 * Calculates the bounding box in lng-lat coordinates of the visible map area
 * that does not overlap with the given UI HTML elements.
 *
 * @remarks
 * This is useful for determining the area of the map that is not obscured by UI components.
 *
 * @param options - The options for calculating map bounds
 * @returns The padded bounding box as [west, south, east, north], or null if the visible area is too small
 *
 * @group Utils
 */
export const calculatePaddedBBox = (options: CalculateMapBoundsOptions): BBox | null => {
    const { map, surroundingElements, paddingPX = 0 } = options;

    const result = calculateVisibleAreaBounds(map, surroundingElements, paddingPX);
    if (!result) {
        return null;
    }

    const { visibleAreaBounds } = result;
    const mapLibreMap = getMapLibreMap(map);
    const sw = mapLibreMap.unproject([visibleAreaBounds.left, visibleAreaBounds.bottom]);
    const ne = mapLibreMap.unproject([visibleAreaBounds.right, visibleAreaBounds.top]);

    return [sw.lng, sw.lat, ne.lng, ne.lat];
};

/**
 * Calculates the center point in lng-lat coordinates of the visible map area
 * that does not overlap with the given UI HTML elements.
 *
 * @remarks
 * * This is useful to offset the map center in a way that it looks harmonious with surrounding UI components.
 * * It's equivalent to the center of calculatePaddedBBox.
 *
 * @param options - The options for calculating map center
 * @returns The center as [lng, lat], or null if the visible area is too small
 *
 * @group Utils
 */
export const calculatePaddedCenter = (options: CalculateMapCenterOptions): Position | null => {
    const { map, surroundingElements } = options;
    const bbox = calculatePaddedBBox({ map, surroundingElements });
    if (!bbox) {
        return null;
    }
    const [west, south, east, north] = bbox;
    return [(west + east) / 2, (south + north) / 2];
};

/**
 * Calculates an expanded bounding box that, when the map is zoomed to it, ensures that the given to-be-contained bounding box
 * is visible within the area not obscured by surrounding UI elements, including optional padding.
 * * In other words, calculates a bounding box that ensure the to-be-contained bbox fits within the visible area of the map.
 *
 * @remarks
 * This is useful when you have a specific geographic area (containedBBox) that you want to be fully visible
 * in the unobscured portion of the map (the area not covered by UI components).
 * The function returns a larger bounding box that accounts for the space taken by UI elements.
 *
 * @param options - The options for calculating expanded bounds
 * @returns The expanded bounding box as [west, south, east, north], or null if the visible area is too small
 *
 * @group Utils
 */
export const calculateFittingBBox = (options: CalculateFittingBBoxOptions): BBox | null => {
    const { map, toBeContainedBBox, surroundingElements, paddingPX = 0 } = options;

    const result = calculateVisibleAreaBounds(map, surroundingElements, paddingPX);
    if (!result) {
        return null;
    }

    const { visibleAreaBounds, containerWidth, containerHeight } = result;

    // Calculate the ratios of how much the visible area is offset from the full container
    // These represent what fraction of the full map the visible area occupies
    const leftRatio = visibleAreaBounds.left / containerWidth;
    const rightRatio = visibleAreaBounds.right / containerWidth;
    const topRatio = visibleAreaBounds.top / containerHeight;
    const bottomRatio = visibleAreaBounds.bottom / containerHeight;

    // Calculate the width and height ratios of the visible area
    const widthRatio = rightRatio - leftRatio;
    const heightRatio = bottomRatio - topRatio;

    // Target bbox coordinates
    const [west, south, east, north] = toBeContainedBBox;
    const targetWidth = east - west;
    const targetHeight = north - south;

    // Calculate the full map extent needed so that when cropped by the visible area,
    // the target bbox fits exactly
    const fullWidth = targetWidth / widthRatio;
    const fullHeight = targetHeight / heightRatio;

    // Calculate the fitting expanded bounds
    // The visible area starts at leftRatio of the full width, so we need to extend west
    const expandedWest = west - leftRatio * fullWidth;
    const expandedEast = expandedWest + fullWidth;

    // For latitude, remember that in pixel coordinates, top is smaller Y but higher latitude
    // topRatio represents the fraction from top, which corresponds to north
    const expandedNorth = north + topRatio * fullHeight;
    const expandedSouth = expandedNorth - fullHeight;

    return [expandedWest, expandedSouth, expandedEast, expandedNorth];
};
