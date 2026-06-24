import type { ReactNode } from 'react';

/** A header icon-button action (≤2 per card header). */
export type IconAction = {
    icon: ReactNode;
    label: string;
    onClick: () => void;
    /** Reflected as `aria-pressed` + a pressed background (a genuine on/off toggle). */
    active?: boolean;
    /** Reflected as `aria-expanded` + a pressed background — for a disclosure control (e.g. the NC
     * collapse chevron, which expands/collapses a region rather than toggling a setting). */
    expanded?: boolean;
    /** Greyed + non-interactive (e.g. the Shift brief action while the agent is mid-turn). */
    disabled?: boolean;
};

export type RailCardProps = {
    /** Header title — ReactNode so callers can compose a tag + text (e.g. the WATCH gradient). */
    title: ReactNode;
    /** Up to two header icon actions, right-aligned. */
    actions?: IconAction[];
    /** Extra classes on the `<header>` (e.g. the area rail's gradient background). */
    headerClassName?: string;
    /** Extra classes on the outer `<section>` (sizing: `max-h-[45%]`, etc.). */
    className?: string;
    'aria-label': string;
    children: ReactNode;
};

/**
 * The right/left-rail card shell: a header band — title + ≤2 icon actions — over a content sheet. The
 * single skeleton every rail panel composes (the OperationsPanel, ClusterPanel, …) so their anatomy
 * converges instead of re-diverging in per-panel markup. The card owns chrome only; sizing and collapse
 * logic stay with the caller.
 */
export function RailCard({
    title,
    actions,
    headerClassName = '',
    className = '',
    'aria-label': ariaLabel,
    children,
}: RailCardProps) {
    return (
        <section
            aria-label={ariaLabel}
            className={`flex shrink-0 flex-col overflow-hidden rounded-(--sdk-radius-10) border border-(--sdk-border-low) bg-(--sdk-surface-0) shadow-(--sdk-shadow-e4) backdrop-blur-md ${className}`}
        >
            <header
                className={`flex shrink-0 items-center gap-2 border-b border-(--sdk-border-low) px-3 py-2 ${headerClassName}`}
            >
                <h3 className="m-0 inline-flex min-w-0 flex-auto items-center gap-2 text-sm font-semibold text-(--sdk-text-high)">
                    {title}
                </h3>
                {actions && actions.length > 0 && (
                    <div className="flex shrink-0 items-center gap-1">
                        {actions.map((action) => (
                            <button
                                key={action.label}
                                type="button"
                                onClick={action.onClick}
                                disabled={action.disabled}
                                aria-label={action.label}
                                aria-pressed={action.active}
                                aria-expanded={action.expanded}
                                title={action.label}
                                className="inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-(--sdk-radius-5) border-0 bg-transparent text-(--sdk-text-medium) transition-colors hover:bg-(--sdk-surface-1) hover:text-(--sdk-text-high) aria-pressed:bg-(--sdk-surface-1) aria-expanded:bg-(--sdk-surface-1) disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-(--sdk-text-medium)"
                            >
                                {action.icon}
                            </button>
                        ))}
                    </div>
                )}
            </header>
            {children}
        </section>
    );
}
