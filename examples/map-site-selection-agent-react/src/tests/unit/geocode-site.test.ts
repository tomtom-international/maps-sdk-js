import type { PlaceType } from '@tomtom-org/maps-sdk/core';
import { geocodeOne } from '@tomtom-org/maps-sdk/services';
import { locatePlace, type ToolState } from '@tomtom-org/maps-sdk-plugin-agent-toolkit';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { geocodeSite } from '../../tools/profile-site';

vi.mock('@tomtom-org/maps-sdk/services', () => ({ geocodeOne: vi.fn() }));
vi.mock('@tomtom-org/maps-sdk-plugin-agent-toolkit', () => ({ getViewportBias: vi.fn(), locatePlace: vi.fn() }));
// The app config reads the Azure settings on import; only the Move Portal key is read from it here.
vi.mock('../../config', () => ({ MOVE_PORTAL_KEY: 'test-key' }));
// The map visuals reach MapLibre, which needs a browser.
vi.mock('../../viz/site-visuals', () => ({}));

const geocodeOneMock = vi.mocked(geocodeOne);
const locatePlaceMock = vi.mocked(locatePlace);

// geocodeSite reads only the base map, and only to hand it to the mocked viewport bias.
const state = { baseMap: {} } as unknown as ToolState;

const place = (freeformAddress: string, score: number, type: PlaceType = 'Street') =>
    ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [-115.17, 36.12] },
        properties: { type, address: { freeformAddress }, matchConfidence: { score } },
    }) as unknown as Awaited<ReturnType<typeof geocodeOne>>;
const poi = (name: string) =>
    ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [-115.17, 36.12] },
        properties: { type: 'POI', address: { freeformAddress: '3355 S Las Vegas Blvd' }, poi: { name } },
    }) as unknown as Awaited<ReturnType<typeof locatePlace>>;
const landmark = poi('The Venetian Resort');

describe('geocodeSite', () => {
    beforeEach(() => {
        geocodeOneMock.mockReset();
        locatePlaceMock.mockReset();
    });

    it('keeps a confident address match without looking the name up as a place', async () => {
        const address = place('3355 S Las Vegas Blvd', 0.95);
        geocodeOneMock.mockResolvedValue(address);
        expect(await geocodeSite('3355 S Las Vegas Blvd', state)).toBe(address);
        expect(locatePlaceMock).not.toHaveBeenCalled();
    });

    it('keeps a low-confidence point address over a POI of another name, as a typo there still names the building', async () => {
        const address = place('Gravesandestraat 24, Amsterdam', 0.6, 'Point Address');
        geocodeOneMock.mockResolvedValue(address);
        locatePlaceMock.mockResolvedValue(poi('Albert Heijn'));
        expect(await geocodeSite('Gravesanderstraat 24', state)).toBe(address);
    });

    it('keeps a low-confidence street match over a POI of another name', async () => {
        const address = place('Kalverstraat, Amsterdam', 0.7);
        geocodeOneMock.mockResolvedValue(address);
        locatePlaceMock.mockResolvedValue(poi('Hema'));
        expect(await geocodeSite('Kalverstraat 92', state)).toBe(address);
    });

    it('prefers a POI named like the query over a low-confidence address match', async () => {
        geocodeOneMock.mockResolvedValue(place('Venetian Way, Miami', 0.4));
        locatePlaceMock.mockResolvedValue(landmark);
        expect(await geocodeSite('The Venetian', state)).toBe(landmark);
    });

    it('finds a landmark whose name geocodes as a low-confidence point address elsewhere', async () => {
        geocodeOneMock.mockResolvedValue(place('Venetiëstraat 1, Almere', 0.5, 'Point Address'));
        locatePlaceMock.mockResolvedValue(landmark);
        expect(await geocodeSite('The Venetian', state)).toBe(landmark);
    });

    it('takes the POI when the address lookup finds nothing', async () => {
        const found = poi('Hema');
        geocodeOneMock.mockRejectedValue(new Error('No results'));
        locatePlaceMock.mockResolvedValue(found);
        expect(await geocodeSite('Kalverstraat 92', state)).toBe(found);
    });

    it('falls back to the low-confidence address when the place lookup rejects', async () => {
        const address = place('Venetian Way, Miami', 0.4);
        geocodeOneMock.mockResolvedValue(address);
        locatePlaceMock.mockRejectedValue(new Error('403'));
        expect(await geocodeSite('The Venetian', state)).toBe(address);
    });

    it('resolves to null when neither lookup finds the site', async () => {
        geocodeOneMock.mockRejectedValue(new Error('No results'));
        locatePlaceMock.mockRejectedValue(new Error('503'));
        expect(await geocodeSite('Nowhere at all', state)).toBeNull();
    });
});
