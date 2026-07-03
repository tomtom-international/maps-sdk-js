import { useSyncExternalStore } from 'react';

// Tool-driven progress log. A tool declares its ordered steps up front and advances through them as
// it runs — NO agent involvement, deterministic. The UI (ToolProgress) renders the live checklist for
// the running tool. Keyed by tool name so the matching tool-call in the chat shows the right run.

export type ProgressRun = {
    tool: string;
    steps: string[];
    /** Index of the step currently running; steps before it are done, after it are pending. */
    currentStep: number;
    done: boolean;
};

let runs: Record<string, ProgressRun> = {};
const listeners = new Set<() => void>();
const emit = (): void => {
    for (const listener of listeners) listener();
};
const subscribe = (listener: () => void): (() => void) => {
    listeners.add(listener);
    return () => {
        listeners.delete(listener);
    };
};

export type ProgressController = {
    /** Mark step `index` as the one now running (earlier steps become "done"). */
    step: (index: number) => void;
    /** All steps complete. */
    done: () => void;
};

/**
 * Begin a progress run for a tool. Returns a controller the tool advances as it works:
 * `const p = startProgress('profileSite', STEPS); p.step(1); …; p.done();`
 * Always call `done()` (including in a finally / on error) so the spinner resolves.
 */
export const startProgress = (tool: string, steps: string[]): ProgressController => {
    runs = { ...runs, [tool]: { tool, steps, currentStep: 0, done: false } };
    emit();
    return {
        step: (index: number) => {
            const run = runs[tool];
            if (!run) return;
            runs = { ...runs, [tool]: { ...run, currentStep: index } };
            emit();
        },
        done: () => {
            const run = runs[tool];
            if (!run) return;
            runs = { ...runs, [tool]: { ...run, currentStep: run.steps.length, done: true } };
            emit();
        },
    };
};

/** Live progress run for a tool, or null if it never ran this session. */
export const useToolProgress = (tool: string): ProgressRun | null =>
    useSyncExternalStore(subscribe, () => runs[tool] ?? null);
