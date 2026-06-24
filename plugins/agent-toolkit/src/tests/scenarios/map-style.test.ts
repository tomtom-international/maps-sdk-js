import { describe, expect, it } from 'vitest';
import { FULL_SCENARIOS, getExamplePrompts, MODEL, runToolScenario } from './helpers';

// Map-style / MapLibre tools. All classify cleanly from a cold turn: list/inspect tools are
// self-contained and the mutate tools carry the target in the prompt. `setLayoutProperties` /
// `setPaintProperties` declare `dependsOn: getMapStyleLayers`, so the agent may call
// `getMapStyleLayers` first in the same turn — the assertion only needs the mutate tool among the
// calls, which the multi-step run satisfies. (executeMaplibreCode's examplePrompts were trimmed in
// the registry to genuinely-uncovered ops after the run showed "add a GeoJSON layer"→addByodSource
// and "animate the camera"→flyTo.)

describe.skipIf(!MODEL)('getStandardMapStyles scenarios', { timeout: 180_000, retry: 3 }, () => {
    const [canonical, ...rest] = getExamplePrompts('getStandardMapStyles');
    it(`classifies the canonical prompt: ${canonical}`, async () => {
        const outcome = await runToolScenario({ expectedTool: 'getStandardMapStyles', prompt: canonical });
        expect(outcome.success, outcome.failureReason).toBe(true);
    });
    it.skipIf(!FULL_SCENARIOS).each(rest)('handles registry examplePrompt: %s', async (prompt) => {
        const outcome = await runToolScenario({ expectedTool: 'getStandardMapStyles', prompt });
        expect(outcome.success, outcome.failureReason).toBe(true);
    });
});

describe.skipIf(!MODEL)('setLanguage scenarios', { timeout: 180_000, retry: 3 }, () => {
    const [canonical, ...rest] = getExamplePrompts('setLanguage');
    it(`classifies the canonical prompt: ${canonical}`, async () => {
        const outcome = await runToolScenario({ expectedTool: 'setLanguage', prompt: canonical });
        expect(outcome.success, outcome.failureReason).toBe(true);
    });
    it.skipIf(!FULL_SCENARIOS).each(rest)('handles registry examplePrompt: %s', async (prompt) => {
        const outcome = await runToolScenario({ expectedTool: 'setLanguage', prompt });
        expect(outcome.success, outcome.failureReason).toBe(true);
    });
});

describe.skipIf(!MODEL)('getMapStyleLayers scenarios', { timeout: 180_000, retry: 3 }, () => {
    const [canonical, ...rest] = getExamplePrompts('getMapStyleLayers');
    it(`classifies the canonical prompt: ${canonical}`, async () => {
        const outcome = await runToolScenario({ expectedTool: 'getMapStyleLayers', prompt: canonical });
        expect(outcome.success, outcome.failureReason).toBe(true);
    });
    it.skipIf(!FULL_SCENARIOS).each(rest)('handles registry examplePrompt: %s', async (prompt) => {
        const outcome = await runToolScenario({ expectedTool: 'getMapStyleLayers', prompt });
        expect(outcome.success, outcome.failureReason).toBe(true);
    });
});

describe.skipIf(!MODEL)('setLayoutProperties scenarios', { timeout: 180_000, retry: 3 }, () => {
    const [canonical, ...rest] = getExamplePrompts('setLayoutProperties');
    it(`classifies the canonical prompt: ${canonical}`, async () => {
        const outcome = await runToolScenario({ expectedTool: 'setLayoutProperties', prompt: canonical });
        expect(outcome.success, outcome.failureReason).toBe(true);
    });
    it.skipIf(!FULL_SCENARIOS).each(rest)('handles registry examplePrompt: %s', async (prompt) => {
        const outcome = await runToolScenario({ expectedTool: 'setLayoutProperties', prompt });
        expect(outcome.success, outcome.failureReason).toBe(true);
    });
});

describe.skipIf(!MODEL)('setPaintProperties scenarios', { timeout: 180_000, retry: 3 }, () => {
    const [canonical, ...rest] = getExamplePrompts('setPaintProperties');
    it(`classifies the canonical prompt: ${canonical}`, async () => {
        const outcome = await runToolScenario({ expectedTool: 'setPaintProperties', prompt: canonical });
        expect(outcome.success, outcome.failureReason).toBe(true);
    });
    it.skipIf(!FULL_SCENARIOS).each(rest)('handles registry examplePrompt: %s', async (prompt) => {
        const outcome = await runToolScenario({ expectedTool: 'setPaintProperties', prompt });
        expect(outcome.success, outcome.failureReason).toBe(true);
    });
});

describe.skipIf(!MODEL)('executeMaplibreCode scenarios', { timeout: 180_000, retry: 3 }, () => {
    const [canonical, ...rest] = getExamplePrompts('executeMaplibreCode');
    it(`classifies the canonical prompt: ${canonical}`, async () => {
        const outcome = await runToolScenario({ expectedTool: 'executeMaplibreCode', prompt: canonical });
        expect(outcome.success, outcome.failureReason).toBe(true);
    });
    it.skipIf(!FULL_SCENARIOS).each(rest)('handles registry examplePrompt: %s', async (prompt) => {
        const outcome = await runToolScenario({ expectedTool: 'executeMaplibreCode', prompt });
        expect(outcome.success, outcome.failureReason).toBe(true);
    });
});
