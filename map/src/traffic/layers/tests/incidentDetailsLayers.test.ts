import { describe, expect, test } from 'vitest';
import { resolveFocusStyle } from '../incidentDetailsLayers';

describe('resolveFocusStyle', () => {
    test('resolves the focus outline colour for the active map theme', () => {
        expect(resolveFocusStyle(undefined, 'light')).toEqual({ outlineColor: '#000', widthScale: 1.6 });
        expect(resolveFocusStyle(undefined, 'dark')).toEqual({ outlineColor: '#FFF', widthScale: 1.6 });
    });

    test('an explicit outline colour wins over the theme default', () => {
        expect(resolveFocusStyle({ outlineColor: '#FF5733' }, 'dark')).toEqual({
            outlineColor: '#FF5733',
            widthScale: 1.6,
        });
    });

    test('`focus: false` disables the treatment in both themes', () => {
        expect(resolveFocusStyle(false, 'light')).toBeNull();
        expect(resolveFocusStyle(false, 'dark')).toBeNull();
    });
});
