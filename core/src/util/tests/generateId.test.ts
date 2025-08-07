import { describe, expect, test } from 'vitest';
import { generateId } from '../generateId';

describe('generateId utility tests', () => {
    test('generateId utility tests', () => {
        expect(generateId()).toEqual(expect.any(String));
    });
});
