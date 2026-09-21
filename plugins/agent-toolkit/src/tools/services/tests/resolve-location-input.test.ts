import { describe, expect, it } from 'vitest';
import { createToolState } from '../../../state';
import type { ToolState } from '../../../types';
import { resolveLocationInput } from '../resolve-location-input';

const mockMap = { mapLibreMap: { getSource: () => undefined, getLayer: () => undefined } } as any;

// A located place: opaque geocoder feature id (place.id) written into an entry whose id is the
// friendly `entryId` hint the model supplied — the two-id shape locatePlace returns.
const makePlace = (featureId: string) =>
    ({
        type: 'Feature',
        id: featureId,
        geometry: { type: 'Point', coordinates: [13.508614, 52.36428] },
        properties: { poi: { name: 'Berlin Brandenburg Airport' } },
    }) as any;

describe('resolveLocationInput — placeIdOrEntryId', () => {
    it('resolves by place feature id', async () => {
        const state: ToolState = createToolState(mockMap);
        await state.places.addPlaceResult(makePlace('odj-dt7ORI31cgNSaRSWcA'), 'Airport', 'berlin-brandenburg-airport');

        const resolved = await resolveLocationInput({ placeIdOrEntryId: 'odj-dt7ORI31cgNSaRSWcA' }, state);

        expect(resolved?.position).toEqual([13.508614, 52.36428]);
        expect(resolved?.name).toBe('Berlin Brandenburg Airport');
    });

    // The regression: the model passes the entry id it just set (placesEntryId), not the feature id.
    // Before the fallback this returned null and setRoute failed with "Could not resolve".
    it('falls back to resolving by places entry id', async () => {
        const state: ToolState = createToolState(mockMap);
        await state.places.addPlaceResult(makePlace('odj-dt7ORI31cgNSaRSWcA'), 'Airport', 'berlin-brandenburg-airport');

        const resolved = await resolveLocationInput({ placeIdOrEntryId: 'berlin-brandenburg-airport' }, state);

        expect(resolved?.position).toEqual([13.508614, 52.36428]);
        expect(resolved?.name).toBe('Berlin Brandenburg Airport');
    });

    it('returns null when neither a feature id nor an entry id matches', async () => {
        const state: ToolState = createToolState(mockMap);
        await state.places.addPlaceResult(makePlace('odj-dt7ORI31cgNSaRSWcA'), 'Airport', 'berlin-brandenburg-airport');

        const resolved = await resolveLocationInput({ placeIdOrEntryId: 'messe-berlin' }, state);

        expect(resolved).toBeNull();
    });
});
