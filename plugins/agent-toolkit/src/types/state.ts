/**
 * Common interface for state slices. Implement `reset()` to participate
 * in cleanup when `destroy()` is called on the agent.
 *
 * All built-in state classes implement this. Custom slices can optionally
 * implement it to get automatic cleanup.
 *
 * @group Agent Toolkit
 */
export interface StateSlice {
    reset(): void;
}
