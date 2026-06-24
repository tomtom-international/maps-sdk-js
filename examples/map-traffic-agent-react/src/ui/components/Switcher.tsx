import type { ReactNode } from 'react';

export type SwitcherTab<T extends string> = {
    id: T;
    /** Tab face — caller may compose text + a count/unread badge. */
    label: ReactNode;
    'aria-label'?: string;
};

/**
 * The segmented control that multiplexes views inside one rail card (e.g. trackers vs notifications in
 * one slot). A group of pill buttons; the selected one gets the raised surface. Pure control: the caller
 * owns the value + the panels it switches between. Equal-width tabs so segment widths stay stable as
 * badges appear/disappear.
 */
export function Switcher<T extends string>({
    tabs,
    value,
    onChange,
    'aria-label': ariaLabel,
}: {
    tabs: readonly SwitcherTab<T>[];
    value: T;
    onChange: (id: T) => void;
    'aria-label': string;
}) {
    return (
        <div
            role="group"
            aria-label={ariaLabel}
            className="flex gap-1 rounded-(--sdk-radius-5) bg-(--sdk-surface-1) p-1"
        >
            {tabs.map((tab) => {
                const selected = tab.id === value;
                return (
                    <button
                        key={tab.id}
                        type="button"
                        aria-pressed={selected}
                        aria-label={tab['aria-label']}
                        onClick={() => onChange(tab.id)}
                        className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-[calc(var(--sdk-radius-5)-2px)] border-0 px-2 py-1 text-[12px] font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-(--sdk-primary-color) ${
                            selected
                                ? 'bg-(--sdk-surface-0) text-(--sdk-text-high) shadow-(--sdk-shadow-e2)'
                                : 'cursor-pointer bg-transparent text-(--sdk-text-medium) hover:text-(--sdk-text-high)'
                        }`}
                    >
                        {tab.label}
                    </button>
                );
            })}
        </div>
    );
}
