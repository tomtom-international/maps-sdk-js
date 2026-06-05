import { type ScenarioExecutionLike, type ScenarioExecutionStateLike, type ScriptStep } from '@langwatch/scenario';
import { getDefaultToolPrompts, type ToolName } from '../../tools';
import { MODEL } from './config';
import { MapAgentScenarioAdapter } from './map-agent-adapter';

export { type AzureConfig, azureConfig, MODEL } from './config';

export const agentAdapter = () => new MapAgentScenarioAdapter(MODEL!);

// Gates the `it.each(REGISTRY_PROMPTS)` blocks in every per-tool file. Default = off, so
// `pnpm test:scenarios` runs only the canonical hand-picked scenarios (~23 tests, ~40s
// in parallel, ~$0.50). Set to `'1'` for the broad-coverage suite that fans out across
// every `examplePrompts` array in the registry (~121 tests, ~5–15 min, ~$5).
export const FULL_SCENARIOS = process.env.SCENARIOS_FULL === '1';

// Materialize all default-tool prompts once at import time. Reuses the registry's own
// `getDefaultToolPrompts()` so this helper stays in lockstep with how `chat-ui` and other
// consumers see the same prompt set — single source of truth.
const ALL_REGISTRY_PROMPTS = getDefaultToolPrompts();

// Read the `examplePrompts` array for a single tool. Per-tool scenario files use this so a
// registry edit propagates to the tests on the next run.
export function getExamplePrompts(toolName: ToolName): readonly string[] {
    return ALL_REGISTRY_PROMPTS[toolName] ?? [];
}

export function expectToolCalled(...toolNames: string[]): ScriptStep {
    return async (state: ScenarioExecutionStateLike, executor: ScenarioExecutionLike) => {
        const calledTool = toolNames.find((name) => state.hasToolCall(name));
        if (calledTool) {
            await executor.succeed(`Called expected tool: ${calledTool}`);
        } else {
            const toolMessages = state.messages
                .filter((m) => m.role === 'tool')
                .map((m) => JSON.stringify(m).slice(0, 120))
                .join(', ');
            await executor.fail(
                `Expected one of [${toolNames.join(', ')}] to be called. Tool messages: ${toolMessages || 'none'}`,
            );
        }
    };
}

export function expectToolNotCalled(...toolNames: string[]): ScriptStep {
    return async (state: ScenarioExecutionStateLike, executor: ScenarioExecutionLike) => {
        const calledTool = toolNames.find((name) => state.hasToolCall(name));
        if (!calledTool) {
            await executor.succeed('None of the forbidden tools was called');
        } else {
            await executor.fail(`Tool ${calledTool} was called but should not have been`);
        }
    };
}

// Asserts the named tools were called in order, each in a SEPARATE assistant step (the first
// occurrence of tool N+1 must be in a later assistant message than tool N). Used to prove a
// genuinely sequential flow — e.g. addByodSource → (observe `profile`) → setByodLayers —
// rather than both tools being batched in parallel in a single step. Inspecting assistant messages
// (the tool-CALL messages) rather than tool-result messages is what makes "separate step" strict.
export function expectToolCalledInOrder(...toolNames: string[]): ScriptStep {
    return async (state: ScenarioExecutionStateLike, executor: ScenarioExecutionLike) => {
        const assistantMessages = state.messages.filter((m) => m.role === 'assistant').map((m) => JSON.stringify(m));
        let cursor = -1;
        for (const name of toolNames) {
            const idx = assistantMessages.findIndex((serialized, i) => i > cursor && serialized.includes(`"${name}"`));
            if (idx === -1) {
                await executor.fail(
                    `Expected tool-call order [${toolNames.join(' → ')}], but "${name}" was not found in an ` +
                        `assistant step after position ${cursor} (${assistantMessages.length} assistant steps total).`,
                );
                return;
            }
            cursor = idx;
        }
        await executor.succeed(`Tools called in order across separate steps: ${toolNames.join(' → ')}`);
    };
}

export function expectToolCallCount(toolName: string, expectedCount: number): ScriptStep {
    return async (state: ScenarioExecutionStateLike, executor: ScenarioExecutionLike) => {
        // Count tool-result messages referencing this tool — one result = one invocation.
        const actualCount = state.messages.filter(
            (m) => m.role === 'tool' && JSON.stringify(m).includes(`"${toolName}"`),
        ).length;
        if (actualCount === expectedCount) {
            await executor.succeed(`${toolName} was called exactly ${expectedCount} time(s)`);
        } else {
            await executor.fail(
                `Expected ${toolName} to be called ${expectedCount} time(s), but it was called ${actualCount} times`,
            );
        }
    };
}
