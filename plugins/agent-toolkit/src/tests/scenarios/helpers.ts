import { type ScenarioExecutionLike, type ScenarioExecutionStateLike, type ScriptStep } from '@langwatch/scenario';
import { MODEL } from './config';
import { MapAgentScenarioAdapter } from './map-agent-adapter';

export { type AzureConfig, azureConfig, MODEL } from './config';

export const agentAdapter = () => new MapAgentScenarioAdapter(MODEL!);

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
