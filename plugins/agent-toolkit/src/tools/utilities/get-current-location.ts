/**
 * @module agent-toolkit-tools
 */

import { z } from 'zod';
import type { ToolState } from '../../types';
import { toolErrorSchema } from '../shared-output-schemas';

/**
 * Tool schema for retrieving browser current location.
 */
export const getCurrentLocationSchema = z.object({});

/**
 * Output schema for current location tool.
 */
export const getCurrentLocationOutputSchema = z.union([
    z.object({
        position: z.array(z.number()).min(2).max(2).describe('[longitude, latitude]'),
        accuracy: z.number().describe('Accuracy of the location in meters'),
        timestamp: z.number().describe('Timestamp of the location data'),
    }),
    toolErrorSchema,
]);

const getLocationErrorMessage = (error: unknown): string | undefined => {
    if (typeof error !== 'object' || error === null || !('code' in error)) {
        return undefined;
    }

    const code = (error as { code: number }).code;

    if (code === 1) {
        return 'Location permission denied by the user';
    }

    if (code === 2) {
        return 'Current location is unavailable';
    }

    if (code === 3) {
        return 'Timed out while trying to get current location';
    }

    return undefined;
};

export const getCurrentLocationDescription =
    'Browser geolocation — the user\'s physical position [lng, lat] for "near me" / "where I am" queries (may prompt for permission). ' +
    'For map-based reference use getViewport.';

/** Execute function for getCurrentLocation — usable with ToolEntry format. */
export const executeGetCurrentLocation = async (
    _params: z.infer<typeof getCurrentLocationSchema>,
    _state: ToolState,
): Promise<z.infer<typeof getCurrentLocationOutputSchema>> => {
    if (globalThis.window === undefined || globalThis.navigator === undefined) {
        return { error: 'Current location is only available in a browser environment' };
    }

    if (!('geolocation' in globalThis.navigator)) {
        return { error: 'Geolocation is not supported by this browser' };
    }

    try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            globalThis.navigator.geolocation.getCurrentPosition(resolve, reject, {
                enableHighAccuracy: true,
                timeout: 15000,
                maximumAge: 0,
            });
        });

        return {
            position: [position.coords.longitude, position.coords.latitude],
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp,
        };
    } catch (error) {
        const locationErrorMessage = getLocationErrorMessage(error);
        if (locationErrorMessage) {
            return { error: locationErrorMessage };
        }

        return {
            error: `Failed to get current location: ${error instanceof Error ? error.message : String(error)}`,
        };
    }
};
