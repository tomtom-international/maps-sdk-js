/**
 * @vitest-environment jsdom
 */
import { describe, expect, test, vi } from 'vitest';
import { extractImageDimensions } from '../customIconScales';

describe('extractImageDimensions', () => {
    describe('SVG string inputs', () => {
        test('extracts dimensions from SVG with viewBox attribute', () => {
            const svgWithViewBox = '<svg viewBox="0 0 100 200"></svg>';

            const result = extractImageDimensions(svgWithViewBox);

            expect(result).toEqual({ width: 100, height: 200 });
        });

        test('extracts dimensions from SVG with viewBox containing minX and minY offsets', () => {
            const svgWithOffset = '<svg viewBox="10 20 150 300"></svg>';

            const result = extractImageDimensions(svgWithOffset);

            expect(result).toEqual({ width: 150, height: 300 });
        });

        test('extracts dimensions from SVG with width and height attributes (no viewBox)', () => {
            const svgWithDimensions = '<svg width="120" height="140"></svg>';

            const result = extractImageDimensions(svgWithDimensions);

            expect(result).toEqual({ width: 120, height: 140 });
        });

        test('prefers viewBox over width/height attributes when both are present', () => {
            const svgWithBoth = '<svg viewBox="0 0 200 400" width="100" height="200"></svg>';

            const result = extractImageDimensions(svgWithBoth);

            expect(result).toEqual({ width: 200, height: 400 });
        });

        test('handles SVG with decimal dimensions', () => {
            const svgWithDecimals = '<svg viewBox="0 0 54.5 72.25"></svg>';

            const result = extractImageDimensions(svgWithDecimals);

            expect(result).toEqual({ width: 54.5, height: 72.25 });
        });

        test('handles SVG with whitespace-separated viewBox values', () => {
            const svgWithSpaces = '<svg viewBox="0  0   120    140"></svg>';

            const result = extractImageDimensions(svgWithSpaces);

            expect(result).toEqual({ width: 120, height: 140 });
        });

        test('returns null for non-SVG string (URL)', () => {
            const urlString = 'https://example.com/icon.png';

            const result = extractImageDimensions(urlString);

            expect(result).toBeNull();
        });

        test('returns null for SVG without dimensions', () => {
            const svgNoDimensions = '<svg><circle cx="50" cy="50" r="40"/></svg>';

            const result = extractImageDimensions(svgNoDimensions);

            expect(result).toBeNull();
        });
    });

    describe('HTMLImageElement inputs', () => {
        test('extracts dimensions from loaded HTMLImageElement', () => {
            const mockImage = {
                complete: true,
                naturalWidth: 200,
                naturalHeight: 150,
            } as HTMLImageElement;

            const result = extractImageDimensions(mockImage);

            expect(result).toEqual({ width: 200, height: 150 });
        });

        test('returns null for HTMLImageElement that is not loaded', () => {
            const mockImage = {
                complete: false,
                naturalWidth: 0,
                naturalHeight: 0,
            } as HTMLImageElement;

            const result = extractImageDimensions(mockImage);

            expect(result).toBeNull();
        });

        test('returns null for HTMLImageElement with zero dimensions', () => {
            const mockImage = {
                complete: true,
                naturalWidth: 0,
                naturalHeight: 0,
            } as HTMLImageElement;

            const result = extractImageDimensions(mockImage);

            expect(result).toBeNull();
        });
    });

    describe('edge cases', () => {
        test('returns null for undefined input', () => {
            const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

            const result = extractImageDimensions(undefined as unknown as string);

            expect(result).toBeNull();

            consoleSpy.mockRestore();
        });
    });
});
