import { useAui } from '@assistant-ui/react';
import { Fragment, useState } from 'react';

export type ClarifyQuestion = {
    id: string;
    question: string;
    options: string[];
    /** Multi-select: tapping toggles options (checked), and the send button confirms. Single-select
     * (default): tapping an option answers and advances immediately. */
    multiSelect?: boolean;
    allowCustom?: boolean;
};

// Renders a clarifyIntent call as the Figma "Survey wizard" (pinned-composer variant): a ‹ X of N ›
// pager + "Skip ›" at the top, the question title, NUMBERED suggestion rows, and a freeform "Something
// else" input with a brand-red send. Single-select questions answer + advance on tap; multi-select
// questions toggle the tapped rows (checked) and advance when the user hits send (which also folds in
// any freeform text). On the last question it writes every answer into the composer and sends it.

const Divider = () => <div className="h-px w-full bg-(--pb-border-base)" />;

// 24px transparent pager button (Figma: corner-radius/full pill, neutral chevron — text-high enabled,
// text-disabled at a boundary).
function PagerButton({ dir, disabled, onClick }: { dir: 'prev' | 'next'; disabled: boolean; onClick: () => void }) {
    return (
        <button
            type="button"
            disabled={disabled}
            aria-label={dir === 'prev' ? 'Previous question' : 'Next question'}
            onClick={onClick}
            className="flex size-6 items-center justify-center rounded-full text-(--pb-text-high) disabled:cursor-default disabled:text-(--pb-text-disabled)"
        >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                <path
                    d={dir === 'prev' ? 'M15 18l-6-6 6-6' : 'M9 18l6-6-6-6'}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </svg>
        </button>
    );
}

export function ClarifyForm({ questions, onDismiss }: { questions: ClarifyQuestion[]; onDismiss?: () => void }) {
    const aui = useAui();
    const [picks, setPicks] = useState<Record<string, string[]>>({});
    const [step, setStep] = useState(0);
    const [draft, setDraft] = useState('');
    const [submitted, setSubmitted] = useState(false);

    const current = questions[step];
    if (!current) return null;

    const isLast = step >= questions.length - 1;
    const currentPicks = picks[current.id] ?? [];
    const answered = (id: string) => (picks[id]?.length ?? 0) > 0;

    const submitAll = (all: Record<string, string[]>) => {
        // Only answered questions go into the message. An unanswered (skipped) question would otherwise
        // contribute its bare question text, which reads as if the user had typed the question back.
        const answered = questions.map((q) => ({ q, picks: all[q.id] ?? [] })).filter(({ picks }) => picks.length > 0);
        // Skipping everything answers nothing — dismiss the form (restoring the composer) without
        // sending any message; the thread is left untouched.
        if (answered.length === 0) {
            onDismiss?.();
            return;
        }
        // Send the picks as a markdown bullet list — one "question + bold answer" line each — so the
        // user bubble reads as a tidy summary (rendered by marked()) instead of a pipe-run of text.
        const text = answered.map(({ q, picks }) => `- ${q.question} **${picks.join(', ')}**`).join('\n');
        const composer = aui.thread().composer();
        composer.setText(text);
        composer.send();
        setSubmitted(true);
    };

    // Record this question's answer(s), then advance (or submit everything on the last question).
    const recordAndAdvance = (answer: string[]) => {
        if (submitted) return;
        const next = { ...picks, [current.id]: answer };
        setPicks(next);
        setDraft('');
        if (isLast) submitAll(next);
        else setStep((s) => s + 1);
    };

    const onOption = (label: string) => {
        if (submitted) return;
        if (current.multiSelect) {
            // Toggle, stay on the question — the user confirms with send (or the pager).
            setPicks((prev) => {
                const list = prev[current.id] ?? [];
                const nextList = list.includes(label) ? list.filter((o) => o !== label) : [...list, label];
                return { ...prev, [current.id]: nextList };
            });
        } else {
            recordAndAdvance([label]);
        }
    };

    const skip = () => {
        if (submitted) return;
        setDraft('');
        if (isLast) submitAll(picks);
        else setStep((s) => s + 1);
    };

    // Pager navigation clears the freeform draft too, so typed-but-unsent text can't leak onto the
    // question the user lands on.
    const goPrev = () => {
        setDraft('');
        setStep((s) => Math.max(0, s - 1));
    };
    const goNext = () => {
        setDraft('');
        setStep((s) => Math.min(questions.length - 1, s + 1));
    };

    // Send confirms the answer: multi-select picks (if any) plus any freeform text; single-select sends
    // just the freeform text. Either way it advances.
    const send = () => {
        const value = draft.trim();
        const base = current.multiSelect ? currentPicks : [];
        const combined = value && !base.includes(value) ? [...base, value] : base;
        if (combined.length === 0) return;
        recordAndAdvance(combined);
    };

    const canSend = current.multiSelect ? currentPicks.length > 0 || draft.trim().length > 0 : draft.trim().length > 0;

    return (
        <div className="flex w-full flex-col rounded-(--pb-radius-10) border border-(--pb-border-low) bg-(--pb-surface-0)">
            {/* Pager — top-left ‹ X of N › pill (info-accent), only when there's more than one question */}
            {questions.length > 1 && (
                <div className="flex px-3 pt-3">
                    <div className="flex items-center rounded-full bg-[#F5F8FA]">
                        <PagerButton dir="prev" disabled={step === 0 || submitted} onClick={goPrev} />
                        <span className="font-(family-name:--pb-font-primary) text-[12px] leading-[16px] font-bold text-(--pb-text-high) tabular-nums">
                            {step + 1} of {questions.length}
                        </span>
                        <PagerButton
                            dir="next"
                            disabled={isLast || !answered(current.id) || submitted}
                            onClick={goNext}
                        />
                    </div>
                </div>
            )}

            {/* Title row — "Specify domain" + Skip › */}
            <div className="flex items-center gap-6 pt-3 pr-3 pl-4">
                <h3 className="m-0 flex-1 font-(family-name:--pb-font-primary) text-[16px] leading-[24px] font-bold text-(--pb-text-high)">
                    {current.question}
                </h3>
                {!submitted && (
                    <button
                        type="button"
                        onClick={skip}
                        className="inline-flex shrink-0 items-center gap-0.5 font-(family-name:--pb-font-primary) text-[13px] leading-[18px] font-semibold text-(--pb-text-high) transition-opacity hover:opacity-70"
                    >
                        Skip
                        <svg
                            viewBox="0 0 24 24"
                            width="16"
                            height="16"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                        >
                            <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </button>
                )}
            </div>

            {/* Numbered suggestion rows — single-select answers on tap; multi-select toggles a checked state */}
            <div className="flex flex-col px-4">
                {current.options.map((label, i) => {
                    const selected = current.multiSelect && currentPicks.includes(label);
                    return (
                        <Fragment key={label}>
                            {i > 0 && <Divider />}
                            <button
                                type="button"
                                disabled={submitted}
                                aria-pressed={current.multiSelect ? selected : undefined}
                                onClick={() => onOption(label)}
                                className="flex w-full items-center gap-2 py-3 text-left transition-colors hover:bg-(--pb-surface-1) disabled:cursor-default"
                            >
                                <span
                                    className={`flex size-8 shrink-0 items-center justify-center rounded-full font-(family-name:--pb-font-primary) text-[12px] leading-[16px] font-bold ${
                                        selected
                                            ? 'bg-(--pb-text-high) text-white'
                                            : 'bg-[#F5F8FA] text-(--pb-text-high)'
                                    }`}
                                >
                                    {selected ? (
                                        <svg
                                            viewBox="0 0 24 24"
                                            width="12"
                                            height="12"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="3.5"
                                            aria-hidden="true"
                                        >
                                            <path d="M5 12l5 5L19 7" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    ) : (
                                        i + 1
                                    )}
                                </span>
                                <span className="flex-1 text-[16px] leading-[24px] text-(--pb-text-high)">{label}</span>
                            </button>
                        </Fragment>
                    );
                })}
            </div>

            {/* Freeform "Something else" input — pencil + text + brand-red send (also confirms multi-select) */}
            <div className="flex items-center gap-2 border-t border-(--pb-border-low) p-2">
                <span aria-hidden className="flex size-5 shrink-0 items-center justify-center text-(--pb-text-low)">
                    <svg
                        viewBox="0 0 24 24"
                        width="18"
                        height="18"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <path d="M12 20h9" />
                        <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
                    </svg>
                </span>
                <input
                    type="text"
                    value={draft}
                    disabled={submitted}
                    aria-label={`Something else — your own answer for: ${current.question}`}
                    placeholder="Something else"
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            send();
                        }
                    }}
                    className="min-w-0 flex-1 border-0 bg-transparent px-1 text-[14px] leading-[20px] text-(--pb-text-high) outline-none placeholder:text-(--pb-text-low)"
                />
                <button
                    type="button"
                    onClick={send}
                    disabled={submitted || !canSend}
                    aria-label="Send answer"
                    className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full bg-(--pb-primary-color) text-white transition-colors hover:bg-(--pb-primary-hover) disabled:cursor-not-allowed disabled:bg-(--pb-surface-1) disabled:text-(--pb-text-disabled)"
                >
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
                        <path d="M2.01 21 23 12 2.01 3 2 10l15 2-15 2z" />
                    </svg>
                </button>
            </div>
        </div>
    );
}
