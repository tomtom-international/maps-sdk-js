import type { Position } from 'geojson';
import { describe, expect, test, vi } from 'vitest';
import { calculateFittingBBox, calculatePaddedBBox, calculatePaddedCenter } from '../utils';

const createMockMap = (containerWidth: number, containerHeight: number) => ({
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
});

const createMockElement = (left: number, top: number, right: number, bottom: number) =>
    ({
        getBoundingClientRect: () => ({ left, top, right, bottom, width: right - left, height: bottom - top }),
    }) as unknown as HTMLElement;

// (Originally mostly AI-generated)
describe('calculateMapBounds', () => {
    test('returns full bounds when no elements provided', () => {
        const map = createMockMap(100, 100);
        const result = calculatePaddedBBox({ map: map as never, surroundingElements: [] });
        expect(result).toEqual([0, 0, 100, 100]);
    });

    test('applies padding to all edges', () => {
        const map = createMockMap(100, 100);
        const result = calculatePaddedBBox({ map: map as never, surroundingElements: [], paddingPX: 10 });
        expect(result).toEqual([10, 10, 90, 90]);
    });

    test('adjusts bounds for horizontal bar at top', () => {
        const map = createMockMap(100, 100);
        const topBar = createMockElement(0, 0, 100, 20);
        const result = calculatePaddedBBox({ map: map as never, surroundingElements: [topBar] });
        expect(result).toEqual([0, 0, 100, 80]);
    });

    test('adjusts bounds for vertical bar at left', () => {
        const map = createMockMap(100, 100);
        const leftBar = createMockElement(0, 0, 20, 100);
        const result = calculatePaddedBBox({ map: map as never, surroundingElements: [leftBar] });
        expect(result).toEqual([20, 0, 100, 100]);
    });

    test('adjusts bounds for floating element in corner', () => {
        const map = createMockMap(100, 100);
        const floatingElement = createMockElement(5, 5, 25, 25);
        const result = calculatePaddedBBox({ map: map as never, surroundingElements: [floatingElement] });
        // Element is closest to top-left corner, should adjust from closest edge
        expect(result?.[0]).toBeGreaterThanOrEqual(0);
        expect(result?.[2]).toBeLessThanOrEqual(100);
    });

    test('returns null when visible area is too small', () => {
        const map = createMockMap(100, 100);
        const result = calculatePaddedBBox({ map: map as never, surroundingElements: [], paddingPX: 60 });
        expect(result).toBeNull();
    });

    test('ignores elements outside container', () => {
        const map = createMockMap(100, 100);
        const outsideElement = createMockElement(-50, -50, -10, -10);
        const result = calculatePaddedBBox({ map: map as never, surroundingElements: [outsideElement] });
        expect(result).toEqual([0, 0, 100, 100]);
    });
});

describe('calculatePaddedCenter', () => {
    test('returns center of visible bounds', () => {
        const map = createMockMap(100, 100);
        const result = calculatePaddedCenter({ map: map as never, surroundingElements: [] });
        expect(result).toEqual([50, 50]);
    });

    test('returns null when bounds is null', () => {
        const map = createMockMap(100, 100);
        // Create a scenario where bounds becomes null (covered by large bars)
        const topBar = createMockElement(0, 0, 100, 60);
        const bottomBar = createMockElement(0, 50, 100, 100);
        const result = calculatePaddedCenter({ map: map as never, surroundingElements: [topBar, bottomBar] });
        expect(result).toBeNull();
    });

    test('returns adjusted center with UI element', () => {
        const map = createMockMap(100, 100);
        const leftBar = createMockElement(0, 0, 40, 100);
        const result = calculatePaddedCenter({ map: map as never, surroundingElements: [leftBar] });
        // Center should be shifted right due to left bar
        expect(result?.[0]).toBeGreaterThan(50);
    });
});

describe('calculateFittingBBox', () => {
    test('returns same bounds when no elements provided', () => {
        const map = createMockMap(100, 100);
        const containedBBox: [number, number, number, number] = [20, 20, 80, 80];
        const result = calculateFittingBBox({
            map: map as never,
            surroundingElements: [],
            toBeContainedBBox: containedBBox,
        });
        expect(result).toEqual([20, 20, 80, 80]);
    });

    test('expands bounds to account for left bar', () => {
        const map = createMockMap(100, 100);
        const leftBar = createMockElement(0, 0, 20, 100);
        const containedBBox: [number, number, number, number] = [0, 0, 80, 100];
        const result = calculateFittingBBox({
            map: map as never,
            surroundingElements: [leftBar],
            toBeContainedBBox: containedBBox,
        });
        // The expanded bounds should extend west to compensate for the left bar
        expect(result).not.toBeNull();
        expect(result![0]).toBeLessThan(0);
        expect(result![2]).toEqual(80);
    });

    test('expands bounds to account for top bar', () => {
        const map = createMockMap(100, 100);
        const topBar = createMockElement(0, 0, 100, 20);
        const containedBBox: [number, number, number, number] = [0, 0, 100, 80];
        const result = calculateFittingBBox({
            map: map as never,
            surroundingElements: [topBar],
            toBeContainedBBox: containedBBox,
        });
        // The expanded bounds should extend north to compensate for the top bar
        expect(result).not.toBeNull();
        expect(result![3]).toBeGreaterThan(80);
    });

    test('expands bounds to account for right bar', () => {
        const map = createMockMap(100, 100);
        const rightBar = createMockElement(80, 0, 100, 100);
        const containedBBox: [number, number, number, number] = [0, 0, 80, 100];
        const result = calculateFittingBBox({
            map: map as never,
            surroundingElements: [rightBar],
            toBeContainedBBox: containedBBox,
        });
        // The expanded bounds should extend east to compensate for the right bar
        expect(result).not.toBeNull();
        expect(result![2]).toBeGreaterThan(80);
    });

    test('expands bounds to account for bottom bar', () => {
        const map = createMockMap(100, 100);
        const bottomBar = createMockElement(0, 80, 100, 100);
        const containedBBox: [number, number, number, number] = [0, 0, 100, 80];
        const result = calculateFittingBBox({
            map: map as never,
            surroundingElements: [bottomBar],
            toBeContainedBBox: containedBBox,
        });
        // The expanded bounds should extend south to compensate for the bottom bar
        expect(result).not.toBeNull();
        expect(result![1]).toBeLessThan(0);
    });

    test('applies padding when expanding bounds', () => {
        const map = createMockMap(100, 100);
        const containedBBox: [number, number, number, number] = [10, 10, 90, 90];
        const resultWithoutPadding = calculateFittingBBox({
            map: map as never,
            surroundingElements: [],
            toBeContainedBBox: containedBBox,
        });
        const resultWithPadding = calculateFittingBBox({
            map: map as never,
            surroundingElements: [],
            toBeContainedBBox: containedBBox,
            paddingPX: 10,
        });
        // With padding, the expanded bounds should be larger
        expect(resultWithPadding).not.toBeNull();
        expect(resultWithoutPadding).not.toBeNull();
        expect(resultWithPadding![0]).toBeLessThan(resultWithoutPadding![0]);
        expect(resultWithPadding![1]).toBeLessThan(resultWithoutPadding![1]);
        expect(resultWithPadding![2]).toBeGreaterThan(resultWithoutPadding![2]);
        expect(resultWithPadding![3]).toBeGreaterThan(resultWithoutPadding![3]);
    });

    test('returns null when visible area is too small', () => {
        const map = createMockMap(100, 100);
        const containedBBox: [number, number, number, number] = [20, 20, 80, 80];
        const result = calculateFittingBBox({
            map: map as never,
            surroundingElements: [],
            toBeContainedBBox: containedBBox,
            paddingPX: 60,
        });
        expect(result).toBeNull();
    });

    test('handles multiple surrounding elements', () => {
        const map = createMockMap(100, 100);
        const leftBar = createMockElement(0, 0, 20, 100);
        const topBar = createMockElement(0, 0, 100, 20);
        const containedBBox: [number, number, number, number] = [0, 0, 80, 80];
        const result = calculateFittingBBox({
            map: map as never,
            surroundingElements: [leftBar, topBar],
            toBeContainedBBox: containedBBox,
        });
        // The expanded bounds should compensate for both bars
        expect(result).not.toBeNull();
        expect(result![0]).toBeLessThan(0);
        expect(result![3]).toBeGreaterThan(80);
    });
});
