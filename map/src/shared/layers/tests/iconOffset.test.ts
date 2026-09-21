import { describe, expect, test } from 'vitest';
import type { CustomImage } from '../../types/image';
import { buildCustomIconOffsets, buildIconOffsetExpression } from '../iconOffset';
import { ICON_ID } from '../symbolLayers';

describe('buildCustomIconOffsets', () => {
    test('returns an empty map for no icons', () => {
        expect(buildCustomIconOffsets()).toEqual(new Map());
        expect(buildCustomIconOffsets([])).toEqual(new Map());
    });

    test('collects an icon offset under its unsuffixed id', () => {
        const icons: CustomImage[] = [{ id: 'fast-charger', image: '<svg />', offsetX: 4, offsetY: -12 }];

        expect(buildCustomIconOffsets(icons)).toEqual(new Map([['fast-charger', { x: 4, y: -12 }]]));
    });

    test('defaults a missing axis to 0', () => {
        const icons: CustomImage[] = [{ id: 'fast-charger', image: '<svg />', offsetY: -12 }];

        expect(buildCustomIconOffsets(icons)).toEqual(new Map([['fast-charger', { x: 0, y: -12 }]]));
    });

    test('skips an icon that only references an existing sprite by id', () => {
        const icons: CustomImage[] = [{ id: 'sprite-only', offsetX: 4, offsetY: -12 }];

        expect(buildCustomIconOffsets(icons)).toEqual(new Map());
    });

    test('skips an icon with no offset on either axis', () => {
        const icons: CustomImage[] = [
            { id: 'plain', image: '<svg />' },
            { id: 'explicit-zero', image: '<svg />', offsetX: 0, offsetY: 0 },
        ];

        expect(buildCustomIconOffsets(icons)).toEqual(new Map());
    });
});

describe('buildIconOffsetExpression', () => {
    test('returns undefined when the map is empty', () => {
        expect(buildIconOffsetExpression(new Map())).toBeUndefined();
    });

    test('returns undefined when every entry has a zero offset', () => {
        const iconOffsets = new Map([['scaled-icon', { x: 0, y: 0 }]]);

        expect(buildIconOffsetExpression(iconOffsets)).toBeUndefined();
    });

    test('builds a case expression for an icon with a non-zero offset', () => {
        const iconOffsets = new Map([['CAFE-0', { x: 10, y: -5 }]]);

        expect(buildIconOffsetExpression(iconOffsets)).toEqual([
            'case',
            ['==', ['get', ICON_ID], 'CAFE-0'],
            ['literal', [10, -5]],
            ['literal', [0, 0]],
        ]);
    });

    test('includes an icon with only one axis offset', () => {
        const iconOffsets = new Map([['CAFE-0', { x: 10, y: 0 }]]);

        expect(buildIconOffsetExpression(iconOffsets)).toEqual([
            'case',
            ['==', ['get', ICON_ID], 'CAFE-0'],
            ['literal', [10, 0]],
            ['literal', [0, 0]],
        ]);
    });

    test('skips zero-offset entries but includes the rest, in one expression', () => {
        const iconOffsets = new Map([
            ['zero-offset-icon-0', { x: 0, y: 0 }],
            ['offset-icon-0', { x: 8, y: 3 }],
        ]);

        expect(buildIconOffsetExpression(iconOffsets)).toEqual([
            'case',
            ['==', ['get', ICON_ID], 'offset-icon-0'],
            ['literal', [8, 3]],
            ['literal', [0, 0]],
        ]);
    });

    test('accepts the places positioning map entries, offsets extracted by the caller', () => {
        const positioning = new Map([['CAFE-0', { heightScale: 1.5, widthScale: 1.2, offset: { x: 10, y: -5 } }]]);

        const expression = buildIconOffsetExpression([...positioning].map(([id, { offset }]) => [id, offset]));

        expect(expression).toEqual([
            'case',
            ['==', ['get', ICON_ID], 'CAFE-0'],
            ['literal', [10, -5]],
            ['literal', [0, 0]],
        ]);
    });

    test('builds one case branch per offset icon, in insertion order', () => {
        const iconOffsets = new Map([
            ['CAFE-0', { x: 10, y: 0 }],
            ['RESTAURANT-0', { x: 0, y: -20 }],
        ]);

        expect(buildIconOffsetExpression(iconOffsets)).toEqual([
            'case',
            ['==', ['get', ICON_ID], 'CAFE-0'],
            ['literal', [10, 0]],
            ['==', ['get', ICON_ID], 'RESTAURANT-0'],
            ['literal', [0, -20]],
            ['literal', [0, 0]],
        ]);
    });

    test('accepts the output of buildCustomIconOffsets directly', () => {
        const offsets = buildCustomIconOffsets([{ id: 'fast-charger', image: '<svg />', offsetY: -12 }]);

        expect(buildIconOffsetExpression(offsets)).toEqual([
            'case',
            ['==', ['get', ICON_ID], 'fast-charger'],
            ['literal', [0, -12]],
            ['literal', [0, 0]],
        ]);
    });
});
