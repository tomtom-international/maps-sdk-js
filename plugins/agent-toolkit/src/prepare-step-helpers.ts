/**
 * @module agent-toolkit
 * @ignore
 *
 * Pure helpers used by {@link createMapAgent}'s `prepareStep` orchestrator. Extracted from the
 * monolithic module so they can be exercised in isolation by the unit-test suite — none of these
 * touch the AI SDK, the TomTom map, or any singleton state, so they're testable without mocks.
 */

import type { PrepareStepResult, Tool } from 'ai';
import type { ScopableToolInfo } from './tool-setup';
import type { StateSlice, ToolState } from './types';

type ProviderOptions = NonNullable<PrepareStepResult>['providerOptions'];

// Tool objects with mutable description/inputSchema. The AI SDK reads these fresh on every step,
// so per-turn mutation is the supported way to scope a tool's surface — see the concurrency note
// on `createMapAgent`.
type MutableTool = Tool & { description: string; inputSchema: unknown };

/**
 * Build a per-agent serialising mutex. `prepareStep` chains onto this so a concurrent step's
 * classification + scope-mutation cannot interleave with the previous one's request-build window.
 * Each agent instance gets its own chain via a fresh call to this factory.
 *
 * @ignore
 */
export const createPrepareStepMutex = () => {
    let tail: Promise<void> = Promise.resolve();
    return async <T>(fn: () => Promise<T>): Promise<T> => {
        const previous = tail;
        let release: () => void = () => undefined;
        tail = new Promise<void>((resolve) => {
            release = resolve;
        });
        try {
            await previous;
            return await fn();
        } finally {
            release();
        }
    };
};

/**
 * Restore each scopable tool's description + inputSchema to its full-surface defaults. Called at
 * the start of every turn (step 0) before classification so the new turn inherits a clean slate.
 *
 * @ignore
 */
export const restoreScopableTools = (
    tools: Record<string, Tool>,
    scopableTools: Record<string, ScopableToolInfo>,
): void => {
    for (const [name, info] of Object.entries(scopableTools)) {
        const tool = tools[name] as MutableTool | undefined;
        if (!tool) continue;
        tool.description = info.defaultDescription;
        tool.inputSchema = info.defaultInputSchema;
    }
};

/**
 * Apply classifier-emitted per-tool scopes by mutating the live tool object. Validation and
 * rebuilding are encapsulated in {@link ScopableToolInfo.applyScope}; a `null` return covers both
 * mis-shaped payloads and rebuild throws, in which case the default surface stays in place —
 * fail-open, never crash the step.
 *
 * @ignore
 */
export const applyToolScopes = (
    tools: Record<string, Tool>,
    scopableTools: Record<string, ScopableToolInfo>,
    toolScopes: Record<string, unknown> | undefined,
): void => {
    if (!toolScopes) return;
    for (const [name, rawScope] of Object.entries(toolScopes)) {
        const scopableTool = scopableTools[name];
        if (!scopableTool || rawScope == null) continue;
        const tool = tools[name] as MutableTool | undefined;
        if (!tool) continue;
        const rebuiltTool = scopableTool.applyScope(rawScope);
        if (!rebuiltTool) continue;
        tool.description = rebuiltTool.description;
        tool.inputSchema = rebuiltTool.inputSchema;
    }
};

/**
 * Intersect two activeTools lists. Returns `undefined` only when neither side was set (so the
 * caller can omit the key from `PrepareStepResult` entirely). When only one side is set the
 * intersection is that side; when both are set, the result preserves `a`'s order and drops any
 * name absent from `b`. Used to combine classifier-picked tools with a user-supplied override.
 *
 * @ignore
 */
export const intersectActiveTools = (
    a: string[] | undefined,
    b: readonly (string | number | symbol)[] | undefined,
): string[] | undefined => {
    if (!a) return b as string[] | undefined;
    if (!b) return a;
    const setB = new Set(b);
    return a.filter((name) => setB.has(name));
};

/**
 * Type guard for {@link StateSlice}. Detects the canonical shape (an object with a callable
 * `reset` method) without committing to a particular slice's full surface — used by
 * {@link destroyState} to walk the heterogeneous ToolState bag without per-slice knowledge.
 *
 * @ignore
 */
export const isStateSlice = (value: unknown): value is StateSlice =>
    typeof value === 'object' &&
    value !== null &&
    'reset' in value &&
    typeof (value as { reset: unknown }).reset === 'function';

/**
 * Reset every slice on `state` that implements {@link StateSlice}. Slices without a `reset`
 * method (e.g. the bare-bones `baseMap` proxy) are skipped silently.
 *
 * @ignore
 */
export const destroyState = (state: ToolState): void => {
    for (const slice of Object.values(state)) {
        if (isStateSlice(slice)) {
            slice.reset();
        }
    }
};

/**
 * Merge per-provider keys from the developer's `prepareStep` override and the agent's per-step
 * providerOptions factory. Either side may be `undefined`; the developer's values win on
 * collision so caller intent is preserved. Returns `undefined` when both sides are absent so
 * callers can omit the key from the final result.
 *
 * @ignore
 */
export const mergeProviderOptions = (
    fromStepFactory: ProviderOptions | undefined,
    fromUser: ProviderOptions | undefined,
): ProviderOptions | undefined => {
    if (!fromStepFactory && !fromUser) return undefined;
    return { ...fromStepFactory, ...fromUser };
};

/**
 * Compose the PrepareStepResult from three independent contributions: the active-tools list
 * (from the classifier), the per-step providerOptions factory, and the developer's optional
 * user-level `prepareStep` override. When the user overrides, their `activeTools` are
 * intersected with the classifier picks (so the user can narrow further but not widen past the
 * classifier's choice).
 *
 * @ignore
 */
export const composeStepResult = (
    activeTools: string[] | undefined,
    stepProviderOptions: ProviderOptions | undefined,
    userResult: PrepareStepResult | undefined,
): PrepareStepResult => {
    if (userResult) {
        return {
            ...userResult,
            activeTools: intersectActiveTools(activeTools, userResult.activeTools),
            providerOptions: mergeProviderOptions(stepProviderOptions, userResult.providerOptions),
        };
    }
    return {
        ...(activeTools ? { activeTools } : {}),
        ...(stepProviderOptions ? { providerOptions: stepProviderOptions } : {}),
    };
};
