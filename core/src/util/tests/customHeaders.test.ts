import { GlobalConfig } from '@tomtom-org/maps-sdk/core';
import { describe, expect, test } from 'vitest';
import { generateTomTomHeaders, TOMTOM_USER_AGENT_SDK_NAME } from '../headers';

describe('CustomHeaders', () => {
    // Regular expression to match tomtom-user-agent header value
    // Supports version format: X.Y.Z with optional suffix (e.g., X.Y.Z-branch-name)
    const tomtomUserAgentRegex = new RegExp(`^${TOMTOM_USER_AGENT_SDK_NAME}\\/\\d+\\.\\d+\\.\\d+.*$`);

    test('Generate default', () => {
        const headers = generateTomTomHeaders({});
        expect(headers['tomtom-user-agent']).toMatch(tomtomUserAgentRegex);
    });

    test('Generate custom Tracking-ID', () => {
        const trackingId = 'My-Tracking-ID';
        const headers = generateTomTomHeaders({ trackingId });
        expect(headers['Tracking-ID']).toEqual(trackingId);
        expect(headers['tomtom-user-agent']).toMatch(tomtomUserAgentRegex);
    });

    test('Generate custom Tracking-ID and TomTom User Agent', () => {
        const trackingId = 'My-Tracking-ID';
        const headers = generateTomTomHeaders({ trackingId });
        expect(headers).toEqual({ 'Tracking-ID': trackingId, 'tomtom-user-agent': expect.any(String) });
        expect(headers['tomtom-user-agent']).toMatch(tomtomUserAgentRegex);
    });

    test('Throw an error with invalid tracking-id', () => {
        const headers = () => generateTomTomHeaders({ trackingId: '-*-//' });
        expect(headers).toThrow(TypeError);
    });

    test('Override tomtom-user-agent via params', () => {
        const headers = generateTomTomHeaders({ 'tomtom-user-agent': 'CustomAgent/1.0' } as unknown as GlobalConfig);
        expect(headers['tomtom-user-agent']).toBe('CustomAgent/1.0');
    });
});
