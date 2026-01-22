import type { Position } from 'geojson';
import type { Map } from 'maplibre-gl';
import { describe, expect, test, vi } from 'vitest';
import { calculateFittingBBox, calculatePaddedBBox, calculatePaddedCenter } from '../utils';

const createMockMap = (containerWidth: number, containerHeight: number): Map =>
    ({
        getContainer: vi.fn().mockReturnValue({
            getBoundingClientRect: () => ({
                left: 0,
                top: 0,
                right: containerWidth,
                bottom: containerHeight,
                width: containerWidth,
                height: containerHeight,
            }),
        }),
        unproject: vi.fn().mockImplementation(([x, y]: Position) => ({
            lng: x,
            lat: containerHeight - y,
        })),
    }) as unknown as Map;

const createMockElement = (left: number, top: number, right: number, bottom: number) =>
    ({
        getBoundingClientRect: () => ({ left, top, right, bottom, width: right - left, height: bottom - top }),
    }) as unknown as HTMLElement;

// (Originally mostly AI-generated)
describe('calculateMapBounds', () => {
    test('returns full bounds when no elements provided', () => {
        expect(calculatePaddedBBox({ map: createMockMap(100, 100), surroundingElements: [] })).toEqual([
            0, 0, 100, 100,
        ]);
    });

    test('applies padding to all edges', () => {
        expect(calculatePaddedBBox({ map: createMockMap(100, 100), surroundingElements: [], paddingPX: 10 })).toEqual([
            10, 10, 90, 90,
        ]);
    });

    test('adjusts bounds for horizontal bar at top', () => {
        expect(
            calculatePaddedBBox({
                map: createMockMap(100, 100),
                surroundingElements: [createMockElement(0, 0, 100, 20)],
            }),
        ).toEqual([0, 0, 100, 80]);
    });

    test('adjusts bounds for vertical bar at left', () => {
        expect(
            calculatePaddedBBox({
                map: createMockMap(100, 100),
                surroundingElements: [createMockElement(0, 0, 20, 100)],
            }),
        ).toEqual([20, 0, 100, 100]);
    });

    test('adjusts bounds for floating element in corner', () => {
        const result = calculatePaddedBBox({
            map: createMockMap(100, 100),
            surroundingElements: [createMockElement(5, 5, 25, 25)],
        });
        // Element is closest to top-left corner, should adjust from closest edge
        expect(result?.[0]).toBeGreaterThanOrEqual(0);
        expect(result?.[2]).toBeLessThanOrEqual(100);
    });

    test('returns null when visible area is too small', () => {
        expect(
            calculatePaddedBBox({ map: createMockMap(100, 100), surroundingElements: [], paddingPX: 60 }),
        ).toBeNull();
    });

    test('ignores elements outside container', () => {
        expect(
            calculatePaddedBBox({
                map: createMockMap(100, 100),
                surroundingElements: [createMockElement(-50, -50, -10, -10)],
            }),
        ).toEqual([0, 0, 100, 100]);
    });
});

describe('calculatePaddedCenter', () => {
    test('returns center of visible bounds', () => {
        expect(calculatePaddedCenter({ map: createMockMap(100, 100), surroundingElements: [] })).toEqual([50, 50]);
    });

    test('returns null when bounds is null', () => {
        // Create a scenario where bounds becomes null (covered by large bars)
        expect(
            calculatePaddedCenter({
                map: createMockMap(100, 100),
                surroundingElements: [createMockElement(0, 0, 100, 60), createMockElement(0, 50, 100, 100)],
            }),
        ).toBeNull();
    });

    test('returns adjusted center with UI element', () => {
        const result = calculatePaddedCenter({
            map: createMockMap(100, 100),
            surroundingElements: [createMockElement(0, 0, 40, 100)],
        });
        // Center should be shifted right due to left bar
        expect(result?.[0]).toBeGreaterThan(50);
    });
});

describe('calculateFittingBBox', () => {
    test('returns same bounds when no elements provided', () => {
        expect(
            calculateFittingBBox({
                map: createMockMap(100, 100),
                surroundingElements: [],
                toBeContainedBBox: [20, 20, 80, 80],
            }),
        ).toEqual([20, 20, 80, 80]);
    });

    test('expands bounds to account for left bar', () => {
        const result = calculateFittingBBox({
            map: createMockMap(100, 100),
            surroundingElements: [createMockElement(0, 0, 20, 100)],
            toBeContainedBBox: [0, 0, 80, 100],
        });
        // The expanded bounds should extend west to compensate for the left bar
        expect(result).not.toBeNull();
        expect(result?.[0]).toBeLessThan(0);
        expect(result?.[2]).toEqual(80);
    });

    test('expands bounds to account for top bar', () => {
        const result = calculateFittingBBox({
            map: createMockMap(100, 100),
            surroundingElements: [createMockElement(0, 0, 100, 20)],
            toBeContainedBBox: [0, 0, 100, 80],
        });
        // The expanded bounds should extend north to compensate for the top bar
        expect(result).not.toBeNull();
        expect(result?.[3]).toBeGreaterThan(80);
    });

    test('expands bounds to account for right bar', () => {
        const result = calculateFittingBBox({
            map: createMockMap(100, 100),
            surroundingElements: [createMockElement(80, 0, 100, 100)],
            toBeContainedBBox: [0, 0, 80, 100],
        });
        // The expanded bounds should extend east to compensate for the right bar
        expect(result).not.toBeNull();
        expect(result?.[2]).toBeGreaterThan(80);
    });

    test('expands bounds to account for bottom bar', () => {
        const result = calculateFittingBBox({
            map: createMockMap(100, 100),
            surroundingElements: [createMockElement(0, 80, 100, 100)],
            toBeContainedBBox: [0, 0, 100, 80],
        });
        // The expanded bounds should extend south to compensate for the bottom bar
        expect(result).not.toBeNull();
        expect(result?.[1]).toBeLessThan(0);
    });

    test('applies padding when expanding bounds', () => {
        const resultWithoutPadding = calculateFittingBBox({
            map: createMockMap(100, 100),
            surroundingElements: [],
            toBeContainedBBox: [10, 10, 90, 90],
        });
        const resultWithPadding = calculateFittingBBox({
            map: createMockMap(100, 100),
            surroundingElements: [],
            toBeContainedBBox: [10, 10, 90, 90],
            paddingPX: 10,
        });
        // With padding, the expanded bounds should be larger
        expect(resultWithPadding).not.toBeNull();
        expect(resultWithoutPadding).not.toBeNull();
        expect(resultWithPadding?.[0]).toBeLessThan(resultWithoutPadding?.[0] as number);
        expect(resultWithPadding?.[1]).toBeLessThan(resultWithoutPadding?.[1] as number);
        expect(resultWithPadding?.[2]).toBeGreaterThan(resultWithoutPadding?.[2] as number);
        expect(resultWithPadding?.[3]).toBeGreaterThan(resultWithoutPadding?.[3] as number);
    });

    test('returns null when visible area is too small', () => {
        expect(
            calculateFittingBBox({
                map: createMockMap(100, 100),
                surroundingElements: [],
                toBeContainedBBox: [20, 20, 80, 80],
                paddingPX: 60,
            }),
        ).toBeNull();
    });

    test('handles multiple surrounding elements', () => {
        const result = calculateFittingBBox({
            map: createMockMap(100, 100),
            surroundingElements: [createMockElement(0, 0, 20, 100), createMockElement(0, 0, 100, 20)],
            toBeContainedBBox: [0, 0, 80, 80],
        });
        // The expanded bounds should compensate for both bars
        expect(result).not.toBeNull();
        expect(result?.[0]).toBeLessThan(0);
        expect(result?.[3]).toBeGreaterThan(80);
    });
});

describe('calculatePaddedBBox with elements extending beyond container', () => {
    test('handles left bar extending beyond left edge', () => {
        // Element starts at -20 (outside container) and extends to 30
        // Should treat as a vertical bar, adjusting left edge to 30
        expect(
            calculatePaddedBBox({
                map: createMockMap(100, 100),
                surroundingElements: [createMockElement(-20, 0, 30, 100)],
            }),
        ).toEqual([30, 0, 100, 100]);
    });

    test('handles right bar extending beyond right edge', () => {
        // Element starts at 70 and extends to 120 (beyond container)
        // Should treat as a vertical bar, adjusting right edge to 70
        expect(
            calculatePaddedBBox({
                map: createMockMap(100, 100),
                surroundingElements: [createMockElement(70, 0, 120, 100)],
            }),
        ).toEqual([0, 0, 70, 100]);
    });

    test('handles top bar extending beyond top edge', () => {
        // Element starts at -10 (outside container) and extends to 25
        // Should treat as a horizontal bar, adjusting top edge to 25
        expect(
            calculatePaddedBBox({
                map: createMockMap(100, 100),
                surroundingElements: [createMockElement(0, -10, 100, 25)],
            }),
        ).toEqual([0, 0, 100, 75]);
    });

    test('handles bottom bar extending beyond bottom edge', () => {
        // Element starts at 75 and extends to 120 (beyond container)
        // Should treat as a horizontal bar, adjusting bottom edge to 75
        expect(
            calculatePaddedBBox({
                map: createMockMap(100, 100),
                surroundingElements: [createMockElement(0, 75, 100, 120)],
            }),
        ).toEqual([0, 25, 100, 100]);
    });

    test('handles corner element extending beyond two edges', () => {
        // Element in bottom-right corner extending beyond both edges
        const result = calculatePaddedBBox({
            map: createMockMap(100, 100),
            surroundingElements: [createMockElement(70, 70, 120, 120)],
        });
        // Should adjust for the corner element
        expect(result).not.toBeNull();
        // The visible area should be reduced by the corner element
        expect(result?.[2]).toBeLessThanOrEqual(70);
    });

    test('handles sidebar extending beyond left and bottom edges', () => {
        // Sidebar that goes from outside the left edge and below the bottom
        // Should treat as a vertical bar on the left
        const result = calculatePaddedBBox({
            map: createMockMap(100, 100),
            surroundingElements: [createMockElement(-10, 20, 40, 120)],
        });
        expect(result).not.toBeNull();
        expect(result?.[0]).toEqual(40);
    });

    test('handles element extending beyond all four edges', () => {
        // Element that covers the entire container and extends beyond all edges
        // This should return null as the element covers everything
        expect(
            calculatePaddedBBox({
                map: createMockMap(100, 100),
                surroundingElements: [createMockElement(-10, -10, 110, 110)],
            }),
        ).toBeNull();
    });
});

describe('calculateFittingBBox with elements extending beyond container', () => {
    test('expands bounds for left bar extending beyond left edge', () => {
        // Element starts at -20 (outside container) and extends to 30
        const result = calculateFittingBBox({
            map: createMockMap(100, 100),
            surroundingElements: [createMockElement(-20, 0, 30, 100)],
            toBeContainedBBox: [30, 0, 100, 100],
        });
        // Should expand west to compensate for the left bar
        expect(result).not.toBeNull();
        expect(result?.[0]).toBeLessThan(30);
    });

    test('expands bounds for right bar extending beyond right edge', () => {
        // Element starts at 70 and extends to 120 (beyond container)
        const result = calculateFittingBBox({
            map: createMockMap(100, 100),
            surroundingElements: [createMockElement(70, 0, 120, 100)],
            toBeContainedBBox: [0, 0, 70, 100],
        });
        // Should expand east to compensate for the right bar
        expect(result).not.toBeNull();
        expect(result?.[2]).toBeGreaterThan(70);
    });

    test('expands bounds for top bar extending beyond top edge', () => {
        // Element starts at -10 (outside container) and extends to 25
        const result = calculateFittingBBox({
            map: createMockMap(100, 100),
            surroundingElements: [createMockElement(0, -10, 100, 25)],
            toBeContainedBBox: [0, 0, 100, 75],
        });
        // Should expand north to compensate for the top bar
        expect(result).not.toBeNull();
        expect(result?.[3]).toBeGreaterThan(75);
    });

    test('expands bounds for bottom bar extending beyond bottom edge', () => {
        // Element starts at 75 and extends to 120 (beyond container)
        const result = calculateFittingBBox({
            map: createMockMap(100, 100),
            surroundingElements: [createMockElement(0, 75, 100, 120)],
            toBeContainedBBox: [0, 25, 100, 100],
        });
        // Should expand south to compensate for the bottom bar
        expect(result).not.toBeNull();
        expect(result?.[1]).toBeLessThan(25);
    });

    test('expands bounds for corner element extending beyond two edges', () => {
        // Element in bottom-right corner extending beyond both edges
        const result = calculateFittingBBox({
            map: createMockMap(100, 100),
            surroundingElements: [createMockElement(70, 70, 120, 120)],
            toBeContainedBBox: [0, 30, 70, 100],
        });
        // Should expand to compensate for the corner element
        expect(result).not.toBeNull();
    });

    test('expands bounds for sidebar extending beyond left and bottom edges', () => {
        // Sidebar that goes from outside the left edge and below the bottom
        const result = calculateFittingBBox({
            map: createMockMap(100, 100),
            surroundingElements: [createMockElement(-10, 20, 40, 120)],
            toBeContainedBBox: [40, 0, 100, 100],
        });
        // Should expand west to compensate for the sidebar
        expect(result).not.toBeNull();
        expect(result?.[0]).toBeLessThan(40);
    });

    test('returns null for element extending beyond all four edges', () => {
        // Element that covers the entire container and extends beyond all edges
        // This should return null as the element covers everything
        expect(
            calculateFittingBBox({
                map: createMockMap(100, 100),
                surroundingElements: [createMockElement(-10, -10, 110, 110)],
                toBeContainedBBox: [0, 0, 100, 100],
            }),
        ).toBeNull();
    });
});
