import { describe, expect, it } from 'vitest';
import { formatDelay } from './format';

describe('formatDelay', () => {
    it('reads "<1 min" for no delay and for one under half a minute', () => {
        expect(formatDelay(0)).toBe('<1 min');
        expect(formatDelay(29)).toBe('<1 min');
        expect(formatDelay(-20)).toBe('<1 min');
    });
    it('signs a delay of half a minute or more', () => {
        expect(formatDelay(30)).toBe('+1 min');
        expect(formatDelay(3660)).toBe('+1 hr 01 min');
    });
    it('formats a negative delay by its size', () => {
        expect(formatDelay(-90)).toBe('+2 min');
    });
});
