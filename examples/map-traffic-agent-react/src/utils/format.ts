import { formatDuration } from '@tomtom-org/maps-sdk/core';

/**
 * Formats a traffic delay (added seconds) for display, e.g. "+30 min" or "+1 hr 30 min".
 * Delegates the seconds-to-hours/minutes formatting to the SDK's formatDuration; sub-minute
 * delays, which formatDuration leaves undefined, render as "<1 min".
 */
export function formatDelay(seconds: number): string {
    const formatted = formatDuration(seconds);
    return formatted ? `+${formatted}` : '<1 min';
}
