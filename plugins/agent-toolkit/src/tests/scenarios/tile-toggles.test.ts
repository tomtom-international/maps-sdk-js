import { describe, expect, it } from 'vitest';
import { FULL_SCENARIOS, getExamplePrompts, MODEL, runToolScenario } from './helpers';

// Vector-tile base-map overlays. The FULL run showed a real, by-design overlap: "hide 3D buildings"
// / "show only restaurant icons" can be served EITHER by the dedicated toggle OR by the lower-level
// getMapStyleLayers→setLayoutProperties(visibility) path, and the classifier legitimately picks
// either. So the base-map-group / POI toggles accept setLayoutProperties as an alternative (see the
// PR description's overlaps notes). The traffic-flow / traffic-incident overlays have no such
// low-level equivalent and stay strict.

describe.skipIf(!MODEL)('toggleTilesBaseMapLayerGroups scenarios', { timeout: 180_000, retry: 3 }, () => {
    const acceptedAlternatives = ['setLayoutProperties'] as const;
    const [canonical, ...rest] = getExamplePrompts('toggleTilesBaseMapLayerGroups');
    it(`classifies the canonical prompt: ${canonical}`, async () => {
        const outcome = await runToolScenario({
            expectedTool: 'toggleTilesBaseMapLayerGroups',
            prompt: canonical,
            acceptedAlternatives,
        });
        expect(outcome.success, outcome.failureReason).toBe(true);
    });
    it.skipIf(!FULL_SCENARIOS).each(rest)('handles registry examplePrompt: %s', async (prompt) => {
        const outcome = await runToolScenario({
            expectedTool: 'toggleTilesBaseMapLayerGroups',
            prompt,
            acceptedAlternatives,
        });
        expect(outcome.success, outcome.failureReason).toBe(true);
    });
});

describe.skipIf(!MODEL)('toggleTilesPOIs scenarios', { timeout: 180_000, retry: 3 }, () => {
    const acceptedAlternatives = ['setLayoutProperties'] as const;
    const [canonical, ...rest] = getExamplePrompts('toggleTilesPOIs');
    it(`classifies the canonical prompt: ${canonical}`, async () => {
        const outcome = await runToolScenario({
            expectedTool: 'toggleTilesPOIs',
            prompt: canonical,
            acceptedAlternatives,
        });
        expect(outcome.success, outcome.failureReason).toBe(true);
    });
    it.skipIf(!FULL_SCENARIOS).each(rest)('handles registry examplePrompt: %s', async (prompt) => {
        const outcome = await runToolScenario({ expectedTool: 'toggleTilesPOIs', prompt, acceptedAlternatives });
        expect(outcome.success, outcome.failureReason).toBe(true);
    });
});

describe.skipIf(!MODEL)('toggleTilesTrafficFlow scenarios', { timeout: 180_000, retry: 3 }, () => {
    const [canonical, ...rest] = getExamplePrompts('toggleTilesTrafficFlow');
    it(`classifies the canonical prompt: ${canonical}`, async () => {
        const outcome = await runToolScenario({ expectedTool: 'toggleTilesTrafficFlow', prompt: canonical });
        expect(outcome.success, outcome.failureReason).toBe(true);
    });
    it.skipIf(!FULL_SCENARIOS).each(rest)('handles registry examplePrompt: %s', async (prompt) => {
        const outcome = await runToolScenario({ expectedTool: 'toggleTilesTrafficFlow', prompt });
        expect(outcome.success, outcome.failureReason).toBe(true);
    });
});

describe.skipIf(!MODEL)('toggleTilesTrafficIncidents scenarios', { timeout: 180_000, retry: 3 }, () => {
    const [canonical, ...rest] = getExamplePrompts('toggleTilesTrafficIncidents');
    it(`classifies the canonical prompt: ${canonical}`, async () => {
        const outcome = await runToolScenario({ expectedTool: 'toggleTilesTrafficIncidents', prompt: canonical });
        expect(outcome.success, outcome.failureReason).toBe(true);
    });
    it.skipIf(!FULL_SCENARIOS).each(rest)('handles registry examplePrompt: %s', async (prompt) => {
        const outcome = await runToolScenario({ expectedTool: 'toggleTilesTrafficIncidents', prompt });
        expect(outcome.success, outcome.failureReason).toBe(true);
    });
});
