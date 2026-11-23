export type ChatErrorState = { summary: string; details?: string };

export const toChatError = (error: unknown): ChatErrorState => {
    const statusCode =
        error instanceof Error && 'statusCode' in error ? (error as { statusCode: number }).statusCode : null;
    const message = error instanceof Error ? error.message : String(error ?? '');
    const details = message || undefined;

    if (statusCode === 429 || message.includes('Too Many Requests')) {
        const retryMatch = message.match(/(\d+)\s*second/i);
        const wait = retryMatch ? `Wait ${retryMatch[1]} seconds, then retry.` : 'Retry shortly.';
        return { summary: `Rate limit exceeded. ${wait}`, details };
    }
    return { summary: "The agent couldn't answer that message.", details };
};

type ChatErrorProps = {
    error: ChatErrorState;
    onRetry: () => void;
};

// One line and a Retry button; the raw error, which can carry a whole tool input, stays folded under Details.
export function ChatError({ error, onRetry }: ChatErrorProps) {
    return (
        <div role="alert" className="message error flex flex-col gap-1">
            <div className="flex items-center justify-between gap-3">
                <span>{error.summary}</span>
                <button
                    type="button"
                    onClick={onRetry}
                    className="shrink-0 rounded-full border border-current px-2.5 py-0.5 text-[12px] leading-[16px] font-bold transition-opacity hover:opacity-80"
                >
                    Retry
                </button>
            </div>
            {error.details && (
                <details className="text-[12px] leading-[16px]">
                    <summary className="cursor-pointer select-none">Details</summary>
                    <pre className="mt-1 max-h-40 overflow-auto whitespace-pre-wrap break-words">{error.details}</pre>
                </details>
            )}
        </div>
    );
}
