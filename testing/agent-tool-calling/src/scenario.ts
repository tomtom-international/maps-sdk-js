import {
    type AgentAdapter,
    agent,
    run,
    type ScenarioExecutionLike,
    type ScenarioExecutionStateLike,
    type ScenarioResult,
    type ScriptStep,
    user,
    userSimulatorAgent,
} from '@langwatch/scenario';
import type { LanguageModel, ModelMessage } from 'ai';
import { MODELS } from './model';

// Gates the broad `examplePrompts` fanout (`it.skipIf(!FULL_SCENARIOS).each(...)`) in per-tool files.
// Default = off, so the canonical smoke set runs; `SCENARIOS_FULL=1` fans out across every prompt.
export const FULL_SCENARIOS = process.env.SCENARIOS_FULL === '1';

// Pulls the content parts off a message whether `content` is a string or an array of typed parts.
type ContentPart = { type: string; toolName?: string; text?: string };
const contentParts = (message: ModelMessage): ContentPart[] =>
    Array.isArray(message.content) ? (message.content as ContentPart[]) : [];

// Human-readable failure summary: which tools the agent actually called, the step reasoning, and the
// agent's final text. Surfaced as the vitest assertion message so failures explain themselves inline.
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
    success: boolean;
    failureReason: string;
    result: ScenarioResult;
};

// Runs a scenario and returns its outcome WITHOUT asserting — the success assertion stays at the test
// level (`expect(outcome.success, outcome.failureReason).toBe(true)`) so each test visibly asserts.
export const runScenario = async (config: Parameters<typeof run>[0]): Promise<ScenarioOutcome> => {
    const result = await run(config);
    return { success: result.success, failureReason: formatScenarioFailure(result), result };
};

// Passes if ANY ONE of the named tools was called (logical OR).
export const expectAnyToolCalled =
    (...toolNames: string[]): ScriptStep =>
    async (state: ScenarioExecutionStateLike, executor: ScenarioExecutionLike) => {
        const calledTool = toolNames.find((name) => state.hasToolCall(name));
        if (calledTool) {
            await executor.succeed(`Called expected tool: ${calledTool}`);
        } else {
            const toolMessages = state.messages
                .filter((message) => message.role === 'tool')
                .map((message) => JSON.stringify(message).slice(0, 120))
                .join(', ');
            await executor.fail(
                `Expected one of [${toolNames.join(', ')}] to be called. Tool messages: ${toolMessages || 'none'}`,
            );
        }
    };

// Passes if NONE of the named tools was called — fails as soon as any one of them was.
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

// Asserts the named tools were called in order, each in a SEPARATE assistant step (the first occurrence
// of tool N+1 must be in a later assistant message than tool N). Proves a genuinely sequential flow.
export const expectToolCalledInOrder =
    (...toolNames: string[]): ScriptStep =>
    async (state: ScenarioExecutionStateLike, executor: ScenarioExecutionLike) => {
        const assistantMessages = state.messages
            .filter((message) => message.role === 'assistant')
            .map((message) => JSON.stringify(message));
        let cursor = -1;
        for (const name of toolNames) {
            const index = assistantMessages.findIndex(
                (serialized, position) => position > cursor && serialized.includes(`"${name}"`),
            );
            if (index === -1) {
                await executor.fail(
                    `Expected tool-call order [${toolNames.join(' → ')}], but "${name}" was not found in an ` +
                        `assistant step after position ${cursor} (${assistantMessages.length} assistant steps total).`,
                );
                return;
            }
            cursor = index;
        }
        await executor.succeed(`Tools called in order across separate steps: ${toolNames.join(' → ')}`);
    };

export const expectToolCallCount =
    (toolName: string, expectedCount: number): ScriptStep =>
    async (state: ScenarioExecutionStateLike, executor: ScenarioExecutionLike) => {
        const actualCount = state.messages.filter(
            (message) => message.role === 'tool' && JSON.stringify(message).includes(`"${toolName}"`),
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
 * One classification scenario: a user `prompt` plus what counts as routing it correctly. Passes when
 * the agent calls `expectedTool` (or any `acceptedAlternatives`) and none of `forbiddenTools`.
 * `priorTurns` stages mid-session state for follow-up tools (built with `priorTurn` from this package).
 */
export type ToolScenarioOptions = {
    expectedTool: string;
    prompt: string;
    acceptedAlternatives?: readonly string[];
    forbiddenTools?: readonly string[];
    priorTurns?: () => ScriptStep[];
    /**
     * Tools that must ALL be called, each in a later step than the previous — asserted with
     * {@link expectToolCalledInOrder} on top of the `expectedTool` check. Use for single-prompt flows
     * that chain tools, e.g. `['addByodSource', 'rankSites']` for "load this layer and rank it".
     */
    inOrder?: readonly string[];
};

/**
 * Binds the per-suite agent factory into a ready-to-use `runToolScenario`. Each suite does:
 * `export const runToolScenario = createToolScenarioRunner((model) => new MapAgentToolCallAdapter(...))`.
 *
 * Every scenario runs once per configured model ({@link MODELS}) — a fresh adapter per run — and only
 * passes when ALL models route correctly, so a prompt that works on one model can't silently regress on
 * another. The failure message names which model(s) failed and what each called.
 */
export const createToolScenarioRunner =
    (makeAgent: (model: LanguageModel) => AgentAdapter) =>
    async ({
        expectedTool,
        prompt,
        acceptedAlternatives = [],
        forbiddenTools = [],
        priorTurns,
        inOrder,
    }: ToolScenarioOptions): Promise<ScenarioOutcome> => {
        const buildScript = (): ScriptStep[] => [
            ...(priorTurns?.() ?? []),
            user(prompt),
            agent(),
            expectAnyToolCalled(expectedTool, ...acceptedAlternatives),
            ...(inOrder?.length ? [expectToolCalledInOrder(...inOrder)] : []),
            ...(forbiddenTools.length ? [expectNoneOfToolsCalled(...forbiddenTools)] : []),
        ];

        const perModel: { id: string; outcome: ScenarioOutcome }[] = [];
        for (const { id, model } of MODELS) {
            const outcome = await runScenario({
                name: `${expectedTool} [${id}] — ${prompt}`,
                description: prompt,
                agents: [makeAgent(model), userSimulatorAgent()],
                script: buildScript(),
            });
            perModel.push({ id, outcome });
        }

        const failed = perModel.filter((entry) => !entry.outcome.success);
        const representative = (failed[0] ?? perModel.at(-1))?.outcome;
        return {
            success: failed.length === 0,
            // Prefix each failing model's diagnostic with its deployment id so logs say which model broke.
            failureReason: failed.map((entry) => `  ✗ [${entry.id}]${entry.outcome.failureReason}`).join('\n'),
            result: representative?.result,
        };
    };
