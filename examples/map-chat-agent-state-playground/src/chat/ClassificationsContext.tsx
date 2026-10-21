import { useAuiState } from '@assistant-ui/react';
import type { ClassificationResult } from '@tomtom-org/maps-sdk-plugin-agent-toolkit';
import { createContext, type ReactNode, useContext } from 'react';

/**
 * Per-turn classifier results, in the order the classifier produced them. Each `MessageComponent`
 * looks up its own entry by computing its ordinal position among non-welcome assistant messages
 * at read time — see {@link useMessageClassification}.
 */
type ContextValue = {
    classifications: readonly (ClassificationResult | null)[];
};

const ClassificationContext = createContext<ContextValue>({ classifications: [] });

const WELCOME_MESSAGE_ID = 'welcome';

type ProviderProps = {
    /** One entry per assistant turn, in the order the classifier produced them. */
    classifications: readonly (ClassificationResult | null)[];
    children: ReactNode;
};

/**
 * Hands the classifier array down through context. Deliberately does NOT pre-compute a
 * `messageId → result` map up here — the previous implementation did, but it depended on
 * `useMemo` re-running when assistant-ui mutated its `thread.messages` list, and that
 * subscription was unreliable for second-turn updates (only the first turn's chip rendered).
 *
 * Each {@link MessageComponent} now subscribes independently via {@link useMessageClassification}
 * and resolves its own ordinal at read time. Cost is O(n) per consumer per render, which is fine
 * at chat-scale message counts.
 */
export function ClassificationsProvider({ classifications, children }: ProviderProps) {
    return <ClassificationContext.Provider value={{ classifications }}>{children}</ClassificationContext.Provider>;
}

/**
 * Resolves the classifier result for the given message id by computing its ordinal among
 * non-welcome assistant messages in `thread.messages`. Done at the consumer (not the provider)
 * so each `MessageComponent` subscribes to assistant-ui's reactive message-list state directly,
 * instead of sharing a derived map whose rebuilds were unreliable.
 *
 * Returns `undefined` when the message is the welcome seed, when its id isn't yet in the
 * messages list, or when its ordinal exceeds the number of classifications produced so far.
 */
export function useMessageClassification(messageId: string): ClassificationResult | null | undefined {
    const { classifications } = useContext(ClassificationContext);
    const messages = useAuiState((s) => s.thread.messages);

    if (messageId === WELCOME_MESSAGE_ID) return undefined;

    let ordinal = -1;
    let cursor = 0;
    for (const message of messages) {
        if (message.role !== 'assistant') continue;
        if (message.id === WELCOME_MESSAGE_ID) continue;
        if (message.id === messageId) {
            ordinal = cursor;
            break;
        }
        cursor++;
    }
    if (ordinal < 0 || ordinal >= classifications.length) return undefined;
    return classifications[ordinal];
}
