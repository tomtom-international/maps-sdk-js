import { describe, expect, test } from 'vitest';
import { knob, knobSettings } from '../knobs';

describe('knob', () => {
    test('current is the default until a value is configured, then overridden', () => {
        expect(knob('labels.sizeFactor', 'factor', 'Size of labels.', 1, undefined)).toMatchObject({
            id: 'labels.sizeFactor',
            kind: 'factor',
            default: 1,
            current: 1,
            overridden: false,
        });
        expect(knob('labels.sizeFactor', 'factor', 'Size of labels.', 1, 1.2)).toMatchObject({
            current: 1.2,
            overridden: true,
        });
    });

    test('extra fields pass through so a module can require available and appliesTo', () => {
        const descriptor = knob('roads.shields', 'toggle', 'Route shields.', true, false, {
            available: true,
            appliesTo: 'tomtom-styles',
        });
        expect(descriptor.available).toBe(true);
        expect(descriptor.appliesTo).toBe('tomtom-styles');
        expect(descriptor.current).toBe(false);
    });
});

describe('knobSettings', () => {
    test('is the overridden subset, keyed by id', () => {
        expect(
            knobSettings([
                knob('labels.sizeFactor', 'factor', '', 1, undefined),
                knob('roads.shields', 'toggle', '', true, false),
            ]),
        ).toStrictEqual({ 'roads.shields': false });
    });
});
