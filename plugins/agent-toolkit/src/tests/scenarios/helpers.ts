import {
    agent,
    run,
    type ScenarioExecutionLike,
    type ScenarioExecutionStateLike,
    type ScenarioResult,
    type ScriptStep,
    user,
    userSimulatorAgent,
} from '@langwatch/scenario';
import type { ModelMessage } from 'ai';
import { getDefaultToolPrompts, type ToolName } from '../../tools';
import { MODEL } from './config';
import { MapAgentScenarioAdapter } from './map-agent-adapter';

export { type AzureConfig, azureConfig, MODEL } from './config';

export const agentAdapter = () => new MapAgentScenarioAdapter(MODEL!);

// Gates the broad `examplePrompts` fanout (`it.skipIf(!FULL_SCENARIOS).each(...)`) in every per-tool
// file. Default = off, so `pnpm test:scenarios` runs only the canonical hand-picked smoke tests
// (~60 tests, fast/cheap). Set `SCENARIOS_FULL=1` (`pnpm test:scenarios:full`) for the broad-coverage
// suite that fans out across every `examplePrompts` array in the registry (~250 tests, ~10–15 min).
export const FULL_SCENARIOS = process.env.SCENARIOS_FULL === '1';

// Materialize all default-tool prompts once at import time. Reuses the registry's own
// `getDefaultToolPrompts()` so this helper stays in lockstep with how `chat-ui` and other
// consumers see the same prompt set — single source of truth.
const ALL_REGISTRY_PROMPTS = getDefaultToolPrompts();

// Read the `examplePrompts` array for a single tool. Per-tool scenario files use this so a
// registry edit propagates to the tests on the next run.
export const getExamplePrompts = (toolName: ToolName): readonly string[] => ALL_REGISTRY_PROMPTS[toolName] ?? [];

// Pulls the content parts off a message regardless of whether `content` is a string or an
// array of typed parts (assistant tool-call / text parts).
type ContentPart = { type: string; toolName?: string; text?: string };
const contentParts = (message: ModelMessage): ContentPart[] =>
    Array.isArray(message.content) ? (message.content as ContentPart[]) : [];

// Builds a human-readable failure summary from a finished scenario: which tools the agent actually
// called, the judge/step reasoning, and the agent's final text (usually a clarification question or
// a "no data loaded" reply). Surfaced as the vitest assertion message so a normal
// `test:scenarios:full` log explains every failure inline — no separate debug run needed.
export const formatScenarioFailure = (result: ScenarioResult): string => {
    const toolsCalled = result.messages.flatMap((message) =>
        contentParts(message)
            .filter((part) => part.type === 'tool-call')
            .map((part) => part.toolName ?? '?'),
    );
    const lastAssistantText = [...result.messages]
        .reverse()
        .filter((message) => message.role === 'assistant')
        .map((message) =>
            typeof message.content === 'string'
                ? message.content
                : contentParts(message)
                      .filter((part) => part.type === 'text')
                      .map((part) => part.text ?? '')
                      .join(' '),
        )
        .find((text) => text.trim().length > 0);

    const lines = [
        `tools called: [${toolsCalled.join(', ') || 'none'}]`,
        result.reasoning ? `outcome: ${result.reasoning}` : '',
        lastAssistantText ? `agent said: "${lastAssistantText.trim().slice(0, 300)}"` : '',
    ].filter(Boolean);
    return `\n  ${lines.join('\n  ')}\n`;
};

/** Outcome of a scenario run, shaped so the test can assert at the top level. */
export type ScenarioOutcome = {
    /** Whether every script step (e.g. `expectAnyToolCalled`) and the judge passed. */
    success: boolean;
    /** Diagnostic for a failed run — the tools the agent called, the judge/step reasoning, and the
     * agent's final text. Pass as the `expect(...)` message so a top-level assertion is
     * self-explanatory in the log. (Built unconditionally; only surfaced when the assertion fails.) */
    failureReason: string;
    /** The raw scenario result, for tests that want to inspect messages directly. */
    result: ScenarioResult;
};

// Runs a scenario and returns its outcome WITHOUT asserting — the success assertion stays at the
// test level (`expect(outcome.success, outcome.failureReason).toBe(true)`) so the assertion is
// readable per-test and SonarQube sees each test actually assert something.
export const runScenario = async (config: Parameters<typeof run>[0]): Promise<ScenarioOutcome> => {
    const result = await run(config);
    return { success: result.success, failureReason: formatScenarioFailure(result), result };
};

// Passes if ANY ONE of the named tools was called (logical OR) — use when several tools are
// acceptable answers to the same prompt. For a strict "all of these were called" check, this is
// NOT it; compose multiple steps instead.
export const expectAnyToolCalled =
    (...toolNames: string[]): ScriptStep =>
    async (state: ScenarioExecutionStateLike, executor: ScenarioExecutionLike) => {
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

// Passes if NONE of the named tools was called — fails as soon as any one of them was. Use to
// assert a prompt stayed within guardrails (e.g. a question that must not trigger a map mutation).
export const expectNoneOfToolsCalled =
    (...toolNames: string[]): ScriptStep =>
    async (state: ScenarioExecutionStateLike, executor: ScenarioExecutionLike) => {
        const calledTool = toolNames.find((name) => state.hasToolCall(name));
        if (calledTool) {
            await executor.fail(`Tool ${calledTool} was called but should not have been`);
        } else {
            await executor.succeed('None of the forbidden tools was called');
        }
    };

// Asserts the named tools were called in order, each in a SEPARATE assistant step (the first
// occurrence of tool N+1 must be in a later assistant message than tool N). Used to prove a
// genuinely sequential flow — e.g. addByodSource → (observe `profile`) → setByodLayers —
// rather than both tools being batched in parallel in a single step. Inspecting assistant messages
// (the tool-CALL messages) rather than tool-result messages is what makes "separate step" strict.
export const expectToolCalledInOrder =
    (...toolNames: string[]): ScriptStep =>
    async (state: ScenarioExecutionStateLike, executor: ScenarioExecutionLike) => {
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

export const expectToolCallCount =
    (toolName: string, expectedCount: number): ScriptStep =>
    async (state: ScenarioExecutionStateLike, executor: ScenarioExecutionLike) => {
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

/**
 * One classification scenario for {@link runToolScenario}: a single user `prompt` plus what counts
 * as the agent routing it correctly. The scenario passes when the agent calls `expectedTool` — or
 * any of `acceptedAlternatives` — within the run. `priorTurns` stages the session state a
 * follow-up/stateful tool needs, so the prompt is judged in a realistic mid-session context instead
 * of as an out-of-the-blue cold turn.
 */
export type ToolScenarioOptions = {
    /** The tool the agent is expected to call for `prompt`. Also labels the scenario. */
    expectedTool: ToolName;
    /** The user utterance under test (usually one of the tool's registry `examplePrompts`). */
    prompt: string;
    /**
     * Extra tools whose call ALSO passes — unioned with `expectedTool`, so never repeat the primary
     * here. Use only for genuine, by-design overlaps where more than one tool is a correct route
     * (e.g. a base-map tile toggle vs. the low-level `setLayoutProperties`), and say why at the call
     * site. Empty by default: the agent must call `expectedTool`.
     */
    acceptedAlternatives?: readonly ToolName[];
    /**
     * Prior conversation turns that stage the state `expectedTool` acts on — built with
     * {@link priorTurn} (seed.ts), which replays a completed turn as real tool-call + tool-result
     * messages. Rebuilt per scenario. Omit for tools that classify cleanly from a cold first turn
     * (inventory / list / direct-imperative prompts).
     */
    priorTurns?: () => ScriptStep[];
};

// Builds the (optionally staged) script, runs the scenario, and returns the outcome WITHOUT
// asserting — the test keeps `expect(outcome.success, outcome.failureReason).toBe(true)` at the top
// level so each `it` visibly asserts (SonarQube-friendly) and reads on its own. This is the shared
// plumbing the per-tool files reuse; the `describe`/`it`/`it.each` stay LITERAL in each test file so
// they remain individually runnable from the IDE gutter.
export const runToolScenario = ({
    expectedTool,
    prompt,
    acceptedAlternatives = [],
    priorTurns,
}: ToolScenarioOptions): Promise<ScenarioOutcome> =>
    runScenario({
        name: `${expectedTool} — ${prompt}`,
        description: prompt,
        agents: [agentAdapter(), userSimulatorAgent()],
        script: [
            ...(priorTurns?.() ?? []),
            user(prompt),
            agent(),
            expectAnyToolCalled(expectedTool, ...acceptedAlternatives),
        ],
    });
