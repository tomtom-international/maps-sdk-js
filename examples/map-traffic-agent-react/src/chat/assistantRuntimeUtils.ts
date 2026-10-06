import type { AssistantRuntime, ThreadAssistantMessage, ThreadMessage, ThreadRuntime } from '@assistant-ui/react';
import { getThreadMessageTokenUsage } from '@assistant-ui/react-ai-sdk';

type AgentResponse = {
    outcome: string;
    toolCalls: { name: string; input: unknown; output: unknown }[];
    usage: { inputTokens: number; outputTokens: number };
};

const isFromAssistant = (m: ThreadMessage): m is ThreadAssistantMessage => m.role === 'assistant';

const extractOutcome = (messages: readonly ThreadMessage[]): string =>
    messages
        .filter(isFromAssistant)
        .flatMap((m) => m.content)
        .filter((p) => p.type === 'text')
        .map((p) => p.text)
        .join('');

const extractToolCalls = (messages: readonly ThreadMessage[]) =>
    messages
        .filter(isFromAssistant)
        .flatMap((m) => m.content)
        .filter((p) => p.type === 'tool-call')
        .map((p) => ({ name: p.toolName, input: p.args, output: p.result }));

const waitForThread = (thread: ThreadRuntime, predicate: (state: ReturnType<ThreadRuntime['getState']>) => boolean) =>
    new Promise<void>((resolve) => {
        if (predicate(thread.getState())) return resolve();
        const unsubscribe = thread.subscribe(() => {
            if (predicate(thread.getState())) {
                unsubscribe();
                resolve();
            }
        });
    });

/**
 * Sends `query` through the runtime's thread and resolves with the assistant
 * response (text + tool calls) once the run settles.
 */
export const sendMessageToCurrentThread = async (runtime: AssistantRuntime, query: string): Promise<AgentResponse> => {
    const { thread } = runtime;

    // Wait for any in-flight run to settle before snapshotting and appending:
    // appending mid-run lets assistant-ui queue/interleave it, and a mid-stream
    // startCount would fold the prior run's tail into this turn.
    await waitForThread(thread, (state) => !state.isRunning);

    const startCount = thread.getState().messages.length;

    // Subscribe before appending so a fast run can't settle in the gap and be
    // missed; require an assistant message so we don't resolve on the interim
    // state that only reflects the appended user query.
    const responded = waitForThread(
        thread,
        (state) => !state.isRunning && state.messages.slice(startCount).some(isFromAssistant),
    );
    thread.append(query);
    await responded;

    const produced = thread.getState().messages.slice(startCount);

    // We only fetch the assistant usage as the UserAgent and Judge usage is captured in Node, while only the AUT is captured in the UI and flows through the bridge
    const rawUsage = getThreadMessageTokenUsage(produced.filter(isFromAssistant).at(-1));
    const usage = { inputTokens: rawUsage?.inputTokens ?? 0, outputTokens: rawUsage?.outputTokens ?? 0 };

    return {
        outcome: extractOutcome(produced),
        toolCalls: extractToolCalls(produced),
        usage,
    };
};
