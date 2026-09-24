import { describe, expect, test } from 'vitest';
import { resolveCountryCrossingColors } from '../countryCrossingColors';

describe('the colours a border crossing plaque draws with', () => {
    test('a light map gets the dark plaque, so the label reads as a label over the canvas', () => {
        expect(resolveCountryCrossingColors(undefined, 'light')).toEqual({ plaque: '#1A2024', text: '#F1F3F5' });
    });

    test('a dark map gets the light plaque, the same opposition the other way round', () => {
        expect(resolveCountryCrossingColors(undefined, 'dark')).toEqual({ plaque: '#F1F3F5', text: '#1A2024' });
    });

    test('a configured plaque keeps a readable label without the caller naming one', () => {
        expect(resolveCountryCrossingColors({ color: '#FFFFFF' }, 'light').text).toBe('#1A2024');
        expect(resolveCountryCrossingColors({ color: '#0B5FA5' }, 'light').text).toBe('#F1F3F5');
    });

    test('an explicit text colour wins over the one measured off the plaque', () => {
        expect(resolveCountryCrossingColors({ color: '#FFFFFF', textColor: '#B00020' }, 'light')).toEqual({
            plaque: '#FFFFFF',
            text: '#B00020',
        });
    });

    test('a text colour alone still sits on the theme plaque', () => {
        expect(resolveCountryCrossingColors({ textColor: '#B00020' }, 'dark')).toEqual({
            plaque: '#F1F3F5',
            text: '#B00020',
        });
    });

    test('an unparseable plaque colour falls back to the light label rather than throwing', () => {
        expect(resolveCountryCrossingColors({ color: 'not-a-color' }, 'light').text).toBe('#F1F3F5');
    });
});
