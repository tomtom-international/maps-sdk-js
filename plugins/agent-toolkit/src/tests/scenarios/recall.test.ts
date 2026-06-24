import { describe, expect, it } from 'vitest';
import { FULL_SCENARIOS, MODEL, runToolScenario } from './helpers';

// The per-kind recall tools were consolidated into the single parameterised `recallState`
// ({ kind?, id? }), which lists/inspects EVERY entry-bearing kind — places / routes / ranges /
// geometries / byod / incidents / trafficAreaAnalytics. These prompts are kind-specific inventory
// questions that must all classify to `recallState`. Cold-classifiable: each is an inventory question
// the agent can only answer by reading state, so no seeded state is needed.
const KIND_INVENTORY_PROMPTS = [
    'What places did I search for?',
    'What routes have I calculated?',
    'What range did I calculate earlier?',
    'What polygons are in state right now?',
    'What customer-uploaded layers do we have?',
    'Which traffic-incident areas have I loaded?',
    'What traffic analytics have I run?',
    'What is in entry places-2?',
] as const;

describe.skipIf(!MODEL)(
    'recall consolidation — every kind inventory routes to recallState',
    { timeout: 180_000, retry: 3 },
    () => {
        const [canonical, ...rest] = KIND_INVENTORY_PROMPTS;
        it(`classifies the canonical prompt: ${canonical}`, async () => {
            const outcome = await runToolScenario({ expectedTool: 'recallState', prompt: canonical });
            expect(outcome.success, outcome.failureReason).toBe(true);
        });
        it.skipIf(!FULL_SCENARIOS).each(rest)(
            'routes a kind-specific recall prompt to recallState: %s',
            async (prompt) => {
                const outcome = await runToolScenario({ expectedTool: 'recallState', prompt });
                expect(outcome.success, outcome.failureReason).toBe(true);
            },
        );
    },
);
