import type { KeyboardEvent } from 'react';

/**
 * Whether a keydown activates the row itself: Enter or Space pressed on the row. A key pressed on a
 * button inside the row bubbles to the row too, and stays that button's own activation.
 */
export const isRowActivationKey = (event: Pick<KeyboardEvent, 'key' | 'target' | 'currentTarget'>): boolean =>
    event.target === event.currentTarget && (event.key === 'Enter' || event.key === ' ');
