import { formatDuration } from '@tomtom-org/maps-sdk/core';

/**
 * Formats a traffic delay (added seconds) for display, e.g. "+30 min" or "+1 hr 30 min".
 * Delegates the seconds-to-hours/minutes formatting to the SDK's formatDuration; a delay under
 * half a minute renders as "<1 min", with no "+".
 */
export function formatDelay(seconds: number): string {
    return Math.abs(seconds) >= 30 ? `+${formatDuration(seconds)}` : '<1 min';
}
