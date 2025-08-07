import { describe, expect, test } from 'vitest';
import { notInTheStyle } from '../errorMessages';

describe('Error messages tests', () => {
    test('Changing while not in the style', () => {
        expect(() => {
            throw notInTheStyle('change this property');
        }).toThrow(
            'Trying to change this property while it is not in the map style. Did you exclude it when loading the map?',
        );
    });
});
