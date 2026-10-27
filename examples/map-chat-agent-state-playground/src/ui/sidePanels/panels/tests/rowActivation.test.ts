import { describe, expect, it } from 'vitest';
import { isRowActivationKey } from '../rowActivation';

const row = {} as Element;
const deleteButton = {} as Element;

describe('isRowActivationKey', () => {
    it('activates the row on Enter or Space pressed on the row', () => {
        expect(isRowActivationKey({ key: 'Enter', target: row, currentTarget: row })).toBe(true);
        expect(isRowActivationKey({ key: ' ', target: row, currentTarget: row })).toBe(true);
    });

    it('leaves Enter on a button inside the row to that button', () => {
        expect(isRowActivationKey({ key: 'Enter', target: deleteButton, currentTarget: row })).toBe(false);
    });

    it('ignores other keys', () => {
        expect(isRowActivationKey({ key: 'Tab', target: row, currentTarget: row })).toBe(false);
    });
});
