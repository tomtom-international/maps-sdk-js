import type { FilterSpecification } from 'maplibre-gl';
import { describe, expect, test } from 'vitest';
import { buildValuesFilter, getMergedAnyFilter, toExpressionFilter } from '../mapLibreFilterUtils';

describe('MapLibreUtils tests', () => {
    describe('toExpressionFilter', () => {
        // Ported from https://github.com/maplibre/maplibre-gl-js/blob/main/src/style-spec/feature_filter/feature_filter.test.ts
        // A filter that already uses the expression syntax has to come back untouched.
        test('leaves expression filters untouched', () => {
            const expressionFilters: FilterSpecification[] = [
                true,
                false,
                ['in', ['get', 'color'], 'reddish'],
                ['in', ['get', 'color'], ['literal', ['red', 'blue']]],
                ['in', 42, '42'],
                ['in', true, 'true'],
                ['in', 'red', ['get', 'colors']],
                ['==', ['get', 'prop'], 'value'],
                ['all', ['has', 'treaty']],
                ['in', ['get', 'city'], ['literal', ['Amsterdam', 'Barcelona']]],
                [
                    'all',
                    ['>=', ['zoom'], 3],
                    ['has', 'icon'],
                    ['!=', ['get', 'name'], ' '],
                    ['==', ['get', 'category'], 'settlement'],
                ],
            ];

            for (const filter of expressionFilters) {
                expect(toExpressionFilter(filter)).toStrictEqual(filter);
            }
        });

        test('converts comparison operators', () => {
            expect(toExpressionFilter(['==', 'prop', 'value'])).toStrictEqual(['==', ['get', 'prop'], 'value']);
            expect(toExpressionFilter(['!=', 'prop', 3])).toStrictEqual(['!=', ['get', 'prop'], 3]);
        });

        // A bare ordering comparison evaluates to null, and logs a type error per feature, when
        // the property is missing or of another type. The guard keeps the legacy `false`.
        test('guards ordering comparisons by the compared type', () => {
            expect(toExpressionFilter(['>', 'delay', 60])).toStrictEqual([
                'all',
                ['==', ['typeof', ['get', 'delay']], 'number'],
                ['>', ['get', 'delay'], 60],
            ]);
            expect(toExpressionFilter(['<=', 'name', 'z'])).toStrictEqual([
                'all',
                ['==', ['typeof', ['get', 'name']], 'string'],
                ['<=', ['get', 'name'], 'z'],
            ]);
        });

        // `get` cannot tell an absent property from one holding null, but a legacy comparison
        // against null only matched a property that was present.
        test('keeps a null comparison from matching an absent property', () => {
            expect(toExpressionFilter(['==', 'name', null] as never)).toStrictEqual([
                'all',
                ['has', 'name'],
                ['==', ['get', 'name'], null],
            ]);
            expect(toExpressionFilter(['!=', 'name', null] as never)).toStrictEqual([
                'any',
                ['!', ['has', 'name']],
                ['!=', ['get', 'name'], null],
            ]);
            // A feature id is unambiguous, so it compares directly.
            expect(toExpressionFilter(['==', '$id', null] as never)).toStrictEqual(['==', ['id'], null]);
        });

        test('converts has and !has', () => {
            expect(toExpressionFilter(['!has', 'disputed'])).toStrictEqual(['!', ['has', 'disputed']]);
            expect(toExpressionFilter(['has', '$type'])).toBe(true);
            expect(toExpressionFilter(['!has', '$type'])).toStrictEqual(['!', true]);
            expect(toExpressionFilter(['has', '$id'])).toStrictEqual(['!=', ['id'], null]);
        });

        test('converts in and !in', () => {
            expect(toExpressionFilter(['in', 'city', 'Amsterdam', 'Barcelona'])).toStrictEqual([
                'in',
                ['get', 'city'],
                ['literal', ['Amsterdam', 'Barcelona']],
            ]);
            expect(toExpressionFilter(['in', 'value', 42])).toStrictEqual(['in', ['get', 'value'], ['literal', [42]]]);
            expect(toExpressionFilter(['!in', 'city', 'Amsterdam'])).toStrictEqual([
                '!',
                ['in', ['get', 'city'], ['literal', ['Amsterdam']]],
            ]);
            // An `in` with no candidate values can never match, so `!in` always matches.
            expect(toExpressionFilter(['in', 'city'])).toBe(false);
            expect(toExpressionFilter(['!in', 'city'])).toStrictEqual(['!', false]);
        });

        test('resolves the reserved $type and $id keys', () => {
            expect(toExpressionFilter(['==', '$type', 'LineString'])).toStrictEqual([
                '==',
                ['geometry-type'],
                'LineString',
            ]);
            expect(toExpressionFilter(['in', '$type', 'Point', 'Polygon'])).toStrictEqual([
                'in',
                ['geometry-type'],
                ['literal', ['Point', 'Polygon']],
            ]);
            expect(toExpressionFilter(['==', '$id', 7])).toStrictEqual(['==', ['id'], 7]);
        });

        test('converts combining operators recursively', () => {
            expect(toExpressionFilter(['all', ['==', 'category', 'built_up_area']])).toStrictEqual([
                'all',
                ['==', ['get', 'category'], 'built_up_area'],
            ]);
            expect(toExpressionFilter(['all', ['!has', 'disputed'], ['has', 'treaty']])).toStrictEqual([
                'all',
                ['!', ['has', 'disputed']],
                ['has', 'treaty'],
            ]);
            expect(toExpressionFilter(['any', ['==', 'a', 1], ['==', 'b', 2]])).toStrictEqual([
                'any',
                ['==', ['get', 'a'], 1],
                ['==', ['get', 'b'], 2],
            ]);
            expect(toExpressionFilter(['none', ['==', 'a', 1]])).toStrictEqual(['!', ['any', ['==', ['get', 'a'], 1]]]);
        });

        // A combining node counts as legacy as soon as one of its children is, so the other
        // children reach the conversion already expressed and have to pass through it untouched.
        // `FilterSpecification` cannot express such a mix, which is why each one is cast.
        test('leaves the expression branches of a mixed filter untouched', () => {
            expect(toExpressionFilter(['all', ['==', ['get', 'a'], 1], ['!has', 'b']] as never)).toStrictEqual([
                'all',
                ['==', ['get', 'a'], 1],
                ['!', ['has', 'b']],
            ]);
            expect(
                toExpressionFilter(['any', ['in', ['get', 'k'], ['literal', [1, 2]]], ['!in', 'class', 'a']] as never),
            ).toStrictEqual([
                'any',
                ['in', ['get', 'k'], ['literal', [1, 2]]],
                ['!', ['in', ['get', 'class'], ['literal', ['a']]]],
            ]);
        });

        // `isExpressionFilter` accepts a boolean as a child of a combining operator, so the
        // conversion has to carry one through rather than read it as a filter node.
        test('carries a boolean branch of a mixed filter through', () => {
            expect(toExpressionFilter(['all', false, ['!has', 'b']] as never)).toStrictEqual([
                'all',
                false,
                ['!', ['has', 'b']],
            ]);
            expect(toExpressionFilter(['any', true, ['!has', 'b']] as never)).toStrictEqual([
                'any',
                true,
                ['!', ['has', 'b']],
            ]);
        });

        // The filters the standard styles carried up to version 0.5.0-0 on the
        // `TrafficIncidents - * marker` layers, which the traffic module merges into.
        test('converts the legacy filters the standard styles used to ship', () => {
            expect(
                toExpressionFilter([
                    'all',
                    ['==', 'icon_category_0', 6],
                    ['in', 'point_type', 'start_point', 'standalone_point'],
                    ['==', 'magnitude_of_delay', 1],
                ]),
            ).toStrictEqual([
                'all',
                ['==', ['get', 'icon_category_0'], 6],
                ['in', ['get', 'point_type'], ['literal', ['start_point', 'standalone_point']]],
                ['==', ['get', 'magnitude_of_delay'], 1],
            ]);
        });

        // MapLibre reads a malformed legacy filter as a constant rather than failing on it.
        test('treats a legacy filter without arguments as a constant', () => {
            expect(toExpressionFilter([] as never)).toBe(true);
            expect(toExpressionFilter(['has'] as never)).toBe(true);
            expect(toExpressionFilter(['none'] as never)).toBe(true);
            // `['all']` and `['any']` are already valid expressions, so they pass through.
            expect(toExpressionFilter(['all'])).toStrictEqual(['all']);
            expect(toExpressionFilter(['any'])).toStrictEqual(['any']);
        });
    });

    test('buildValuesFilter', () => {
        expect(buildValuesFilter('testProp', { show: 'only', values: [3] })).toStrictEqual([
            '==',
            ['get', 'testProp'],
            3,
        ]);
        expect(buildValuesFilter('testProp', { show: 'all_except', values: [3] })).toStrictEqual([
            '!=',
            ['get', 'testProp'],
            3,
        ]);
        expect(buildValuesFilter('testProp', { show: 'only', values: ['a', 'b'] })).toStrictEqual([
            'in',
            ['get', 'testProp'],
            ['literal', ['a', 'b']],
        ]);
        expect(buildValuesFilter('testProp', { show: 'all_except', values: [true, false] })).toStrictEqual([
            '!',
            ['in', ['get', 'testProp'], ['literal', [true, false]]],
        ]);
    });

    test('getMergedAnyFilter', () => {
        expect(getMergedAnyFilter(undefined as never)).toBeNull();
        expect(getMergedAnyFilter([])).toBeNull();

        expect(getMergedAnyFilter([['==', ['get', 'foo'], 3]])).toStrictEqual(['==', ['get', 'foo'], 3]);

        expect(
            getMergedAnyFilter([
                ['==', ['get', 'foo'], 3],
                ['has', 'bar'],
            ]),
        ).toStrictEqual(['any', ['==', ['get', 'foo'], 3], ['has', 'bar']]);
    });
});
