import { useAui } from '@assistant-ui/react';
import { Fragment, useState } from 'react';

export type ClarifyQuestion = {
    id: string;
    question: string;
    options: string[];
    /** Multi-select toggles options (send confirms); single-select answers on tap. */
    multiSelect?: boolean;
    allowCustom?: boolean;
};

// Renders a clarifyIntent call as the Figma survey wizard pinned in the composer slot: pager + Skip,
// question title, numbered options, and a freeform "Something else" input. Single-select answers on tap
// and advances; multi-select and the last question select-then-send. Skip advances (and submits on the
// last question); unanswered questions are skipped.

// Inset (mx-4) so it sits within the padding while the option rows fill full width on hover.
const Divider = () => <div className="mx-4 h-px bg-(--ui-border-base-em)" />;

// 24px transparent pager chevron; dims to text-disabled at a boundary.
function PagerButton({ dir, disabled, onClick }: { dir: 'prev' | 'next'; disabled: boolean; onClick: () => void }) {
    return (
        <button
            type="button"
            disabled={disabled}
            aria-label={dir === 'prev' ? 'Previous question' : 'Next question'}
            onClick={onClick}
            className="flex size-6 items-center justify-center rounded-full text-(--ui-text-high-em) disabled:cursor-default disabled:text-(--ui-text-disabled)"
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
    // Questions whose picks are confirmed via send: multi-select and the last question. Other
    // single-selects answer + advance on tap, so send there carries only freeform text.
    const selectable = current.multiSelect || isLast;

    const submitAll = (all: Record<string, string[]>) => {
        // Only answered questions go into the message; skipped ones are dropped.
        const answered = questions.map((q) => ({ q, picks: all[q.id] ?? [] })).filter(({ picks }) => picks.length > 0);
        // Nothing answered — dismiss without sending.
        if (answered.length === 0) {
            onDismiss?.();
            return;
        }
        // One "question **answer**" markdown line per pick.
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
            // Toggle; stay put until the user sends.
            setPicks((prev) => {
                const list = prev[current.id] ?? [];
                const nextList = list.includes(label) ? list.filter((o) => o !== label) : [...list, label];
                return { ...prev, [current.id]: nextList };
            });
        } else if (isLast) {
            // Last question: select (don't submit) — the user confirms via send.
            setPicks((prev) => ({ ...prev, [current.id]: [label] }));
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

    // Clear the draft on nav so unsent text can't leak onto the next question.
    const goPrev = () => {
        setDraft('');
        setStep((s) => Math.max(0, s - 1));
    };
    const goNext = () => {
        setDraft('');
        setStep((s) => Math.min(questions.length - 1, s + 1));
    };

    // Send confirms this question's picks (only where they're send-confirmed) plus any freeform text,
    // then advances/submits. Non-last single-selects contribute only the freeform text.
    const send = () => {
        const value = draft.trim();
        const base = selectable ? currentPicks : [];
        const combined = value && !base.includes(value) ? [...base, value] : base;
        if (combined.length === 0) return;
        recordAndAdvance(combined);
    };

    // Enabled once there's a send-confirmed pick or freeform text.
    const canSend = (selectable && currentPicks.length > 0) || draft.trim().length > 0;

    return (
        <div className="flex w-full flex-col rounded-(--ui-rounded-10) border border-(--ui-border-low-em) bg-(--ui-surface-0)">
            {/* Controls row — pager pill (multi-question only) on the left, Skip on the right. */}
            <div className="flex items-center justify-between px-3 pt-3">
                {questions.length > 1 ? (
                    <div className="flex items-center rounded-full bg-[#F5F8FA]">
                        <PagerButton dir="prev" disabled={step === 0 || submitted} onClick={goPrev} />
                        <span className="font-(family-name:--ui-font-gilroy) text-[12px] leading-[16px] font-bold text-(--ui-text-high-em) tabular-nums">
                            {step + 1} of {questions.length}
                        </span>
                        <PagerButton
                            dir="next"
                            disabled={isLast || !answered(current.id) || submitted}
                            onClick={goNext}
                        />
                    </div>
                ) : (
                    <span aria-hidden />
                )}
                {!submitted && (
                    <button
                        type="button"
                        onClick={skip}
                        className="inline-flex shrink-0 items-center gap-0.5 font-(family-name:--ui-font-gilroy) text-[13px] leading-[18px] font-semibold text-(--ui-text-high-em) transition-opacity hover:opacity-70"
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

            {/* Question title — Gilroy Bold 20/24 (Figma title 1). */}
            <div className="flex px-4 pt-3">
                <h3 className="m-0 flex-1 font-(family-name:--ui-font-gilroy) text-[20px] leading-[24px] font-bold text-(--ui-text-high-em)">
                    {current.question}
                </h3>
            </div>

            {/* Numbered option rows; a pick renders as a checkmark. Padding is on each row so the hover
                fill spans the full width. */}
            <div className="flex flex-col">
                {current.options.map((label, i) => {
                    // A checked state shows only where picks are send-confirmed (see `selectable`).
                    const selected = selectable && currentPicks.includes(label);
                    return (
                        <Fragment key={label}>
                            {i > 0 && <Divider />}
                            <button
                                type="button"
                                disabled={submitted}
                                aria-pressed={selectable ? selected : undefined}
                                onClick={() => onOption(label)}
                                className="group flex w-full items-center gap-2 px-4 py-3 text-left transition-colors hover:bg-(--ui-surface-1) disabled:cursor-default"
                            >
                                <span
                                    className={`flex size-8 shrink-0 items-center justify-center rounded-full font-(family-name:--ui-font-gilroy) text-[12px] leading-[16px] font-bold transition-colors ${
                                        selected
                                            ? 'bg-(--ui-text-high-em) text-white'
                                            : 'bg-[#F5F8FA] text-(--ui-text-high-em) group-hover:bg-(--ui-surface-0)'
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
                                <span className="flex-1 text-[16px] leading-[24px] text-(--ui-text-high-em)">
                                    {label}
                                </span>
                            </button>
                        </Fragment>
                    );
                })}
            </div>

            {/* Freeform input — auto-growing multi-line textarea over a brand-red send. Enter sends,
                Shift+Enter adds a newline. */}
            <div className="flex flex-col gap-1 border-t border-(--ui-border-low-em) p-2">
                <div className="flex items-start gap-2 px-1 py-1">
                    <span
                        aria-hidden
                        className="mt-0.5 flex size-5 shrink-0 items-center justify-center text-(--ui-text-low-em)"
                    >
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
                    <textarea
                        value={draft}
                        disabled={submitted}
                        rows={1}
                        aria-label={`Something else — your own answer for: ${current.question}`}
                        placeholder="Something else"
                        onChange={(e) => setDraft(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                send();
                            }
                        }}
                        className="max-h-32 min-h-6 min-w-0 flex-1 resize-none overflow-y-auto border-0 bg-transparent p-0 text-[16px] leading-[24px] text-(--ui-text-high-em) outline-none [field-sizing:content] placeholder:text-(--ui-text-low-em)"
                    />
                </div>
                <div className="flex w-full items-center justify-end">
                    <button
                        type="button"
                        onClick={send}
                        disabled={submitted || !canSend}
                        aria-label="Send answer"
                        className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full bg-(--ui-surface-brand-red) text-white transition-colors hover:bg-(--ui-surface-brand-red-hover) disabled:cursor-not-allowed disabled:bg-(--ui-surface-1) disabled:text-(--ui-text-disabled)"
                    >
                        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
                            <path d="M2.01 21 23 12 2.01 3 2 10l15 2-15 2z" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
}
