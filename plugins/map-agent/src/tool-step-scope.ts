/**
 * Closure that tracks which subset of loaded tools the model sees per LLM step.
 * Set before each agent call; applied by `prepareStep` on every LLM roundtrip.
 */
export function createStepScope() {
    let scope: string[] | null = null;

    return {
        /** Restrict the next agent call to these tool names. Pass `null` to use all loaded tools. */
        set(names: string[] | null): void {
            scope = names;
        },

        /** Returns null when no scope is set. */
        getScope(): ReadonlySet<string> | null {
            return scope ? new Set(scope) : null;
        },

        /**
         * Returns the `activeTools` constraint for ToolLoopAgent's `prepareStep` hook.
         */
        prepareStep(): Record<string, unknown> {
            if (!scope) {
                return {};
            }
            return { activeTools: scope };
        },
    };
}

export type StepScope = ReturnType<typeof createStepScope>;
