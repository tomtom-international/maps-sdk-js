/**
 * @vitest-environment jsdom
 */
import { describe, expect, test, vi } from 'vitest';
import type { PlacesModuleConfig } from '../../types/placesModuleConfig';
import { buildCustomIconScalesMap, extractImageDimensions } from '../customIconScales';

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

describe('buildCustomIconScalesMap', () => {
    test('includes offsetX/offsetY for a custom icon with an image, defaulting scale to 1', () => {
        const config: PlacesModuleConfig = {
            icon: {
                categoryIcons: [{ id: 'CAFE', image: 'https://example.com/cafe.png', offsetX: 10, offsetY: -5 }],
            },
        };

        const result = buildCustomIconScalesMap(config, 0);

        expect(result.get('CAFE-0')).toEqual({ heightScale: 1, widthScale: 1, offset: { x: 10, y: -5 } });
    });

    test('defaults the unset offset axis to 0', () => {
        const config: PlacesModuleConfig = {
            icon: {
                categoryIcons: [{ id: 'CAFE', image: 'https://example.com/cafe.png', offsetX: 10 }],
            },
        };

        const result = buildCustomIconScalesMap(config, 0);

        expect(result.get('CAFE-0')).toEqual({ heightScale: 1, widthScale: 1, offset: { x: 10, y: 0 } });
    });

    test('ignores offsetX/offsetY when no image is provided (references an existing sprite icon)', () => {
        const config: PlacesModuleConfig = {
            icon: {
                categoryIcons: [{ id: 'CAFE', offsetX: 10, offsetY: -5 }],
            },
        };

        const result = buildCustomIconScalesMap(config, 0);

        expect(result.size).toBe(0);
    });

    test('combines offset with a real scale difference from the image', () => {
        const config: PlacesModuleConfig = {
            icon: {
                categoryIcons: [{ id: 'CAFE', image: '<svg viewBox="0 0 240 280"></svg>', offsetX: 10, offsetY: -5 }],
            },
        };

        const result = buildCustomIconScalesMap(config, 0);

        // Default pin dimensions are 120x140 — 240x280 is exactly double.
        expect(result.get('CAFE-0')).toEqual({ heightScale: 2, widthScale: 2, offset: { x: 10, y: -5 } });
    });

    test('carries the offset onto the availability-suffixed id too', () => {
        const config: PlacesModuleConfig = {
            icon: {
                categoryIcons: [
                    {
                        id: 'ELECTRIC_VEHICLE_STATION',
                        image: 'https://example.com/ev.png',
                        offsetX: 10,
                        offsetY: 0,
                        availabilityLevel: 'available',
                    },
                ],
            },
        };

        const result = buildCustomIconScalesMap(config, 0);

        const expected = { heightScale: 1, widthScale: 1, offset: { x: 10, y: 0 } };
        expect(result.get('ELECTRIC_VEHICLE_STATION-0')).toEqual(expected);
        expect(result.get('ELECTRIC_VEHICLE_STATION-available-0')).toEqual(expected);
    });

    test('suffixes the icon id with the module instance index', () => {
        const config: PlacesModuleConfig = {
            icon: {
                categoryIcons: [{ id: 'CAFE', image: 'https://example.com/cafe.png', offsetX: 10 }],
            },
        };

        const result = buildCustomIconScalesMap(config, 2);

        expect(result.has('CAFE-2')).toBe(true);
        expect(result.has('CAFE-0')).toBe(false);
    });

    test('excludes an icon with a standard-size image and no offset', () => {
        const config: PlacesModuleConfig = {
            icon: {
                categoryIcons: [{ id: 'CAFE', image: 'https://example.com/cafe.png' }],
            },
        };

        const result = buildCustomIconScalesMap(config, 0);

        expect(result.size).toBe(0);
    });
});
