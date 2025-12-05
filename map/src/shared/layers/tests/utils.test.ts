import { describe, expect, test } from 'vitest';
import { suffixNumber } from '../utils';

describe('suffixNumber', () => {
    test('should suffix a number to a text with a hyphen', () => {
        expect(suffixNumber('route', 0)).toBe('route-0');
        expect(suffixNumber('places_blah', 1)).toBe('places_blah-1');
        expect(suffixNumber('waypointStart', 2)).toBe('waypointStart-2');
    });
});
