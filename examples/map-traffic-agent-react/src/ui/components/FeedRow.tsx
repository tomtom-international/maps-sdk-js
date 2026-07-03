import { type ReactNode, useEffect, useRef, useState } from 'react';
import { relativeAge, shortClock } from '../lib/time';

export type FeedRowTag = { label: string; accent: string };

export type FeedRowProps = {
    /** Left glyph (24px box). Caller passes a kind/type icon; color comes from `iconColor`. */
    icon: ReactNode;
    iconColor: string;
    title: ReactNode;
    /** Body text, clamped to 2 lines. */
    description?: ReactNode;
    /** Status-line chip (e.g. the transition kind). */
    tag?: FeedRowTag;
    /** Transition moment — rendered as a relative age; the caller ticks its own re-render. */
    at: number;
    /** Show the unread dot after the timestamp (present on fresh rows, removed on read). */
    unread?: boolean;
    /** Muted footnote under the status line (e.g. "tracker removed — no scope recorded"). */
    note?: ReactNode;
    /** Whole-row click; when set the row is a button with hover + a brief click flash. */
    onClick?: () => void;
    /** Right-aligned glyph (e.g. a disclosure chevron on an expandable group row). */
    trailing?: ReactNode;
    'aria-label'?: string;
    /** Forwarded to the button for an expandable row (disclosure semantics). */
    'aria-expanded'?: boolean;
};

/**
 * Row skeleton — type icon, title, 2-line description, status line (kind chip + relative time + unread
 * dot). The one shared row for the alert feed and the toasts so their anatomy stays identical. Pure
 * layout: outer chrome (list dividers, toast card/accent, dismiss button) stays with the caller. A
 * click flash confirms the action even when nothing else visibly moves.
 */
export function FeedRow({
    icon,
    iconColor,
    title,
    description,
    tag,
    at,
    unread,
    note,
    onClick,
    trailing,
    'aria-label': ariaLabel,
    'aria-expanded': ariaExpanded,
}: FeedRowProps) {
    const [flash, setFlash] = useState(false);
    const flashTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
    // Clear a pending flash reset if the row unmounts mid-flash (feed re-sort / toast dismiss).
    useEffect(() => () => clearTimeout(flashTimer.current), []);
    const clickable = onClick != null;
    const handleClick = () => {
        if (!onClick) return;
        setFlash(true);
        clearTimeout(flashTimer.current);
        flashTimer.current = setTimeout(() => setFlash(false), 300);
        onClick();
    };

    const Root = clickable ? 'button' : 'div';
    return (
        <Root
            {...(clickable
                ? {
                      type: 'button' as const,
                      onClick: handleClick,
                      'aria-label': ariaLabel,
                      'aria-expanded': ariaExpanded,
                  }
                : {})}
            className={`flex w-full gap-2 border-0 bg-transparent px-3 py-2 text-left ${
                clickable ? 'cursor-pointer transition-colors hover:bg-(--pb-surface-1)' : ''
            }`}
            style={flash ? { backgroundColor: 'color-mix(in srgb, var(--ops-sweep) 20%, transparent)' } : undefined}
        >
            <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center" style={{ color: iconColor }}>
                {icon}
            </span>
            <div className="min-w-0 flex-auto">
                <div className="truncate text-[12px] font-semibold text-(--pb-text-high)">{title}</div>
                {description != null && (
                    <div className="mt-0.5 line-clamp-2 text-[12px] leading-snug text-(--pb-text-medium)">
                        {description}
                    </div>
                )}
                <div className="mt-1 flex items-center gap-2 text-[11px] text-(--pb-text-low)">
                    {tag && (
                        <span
                            className="rounded-full px-1.5 py-px text-[10px] font-semibold uppercase"
                            style={{
                                color: tag.accent,
                                backgroundColor: `color-mix(in srgb, ${tag.accent} 12%, transparent)`,
                            }}
                        >
                            {tag.label}
                        </span>
                    )}
                    <span className="[font-variant-numeric:tabular-nums]" title={shortClock(at)}>
                        {relativeAge(at)}
                    </span>
                    {unread && <span aria-label="unread" className="h-1.5 w-1.5 rounded-full bg-(--pb-color-error)" />}
                </div>
                {note != null && <div className="mt-0.5 text-[10px] text-(--pb-text-low)">{note}</div>}
            </div>
            {trailing != null && (
                <span className="mt-0.5 flex h-6 w-4 shrink-0 items-center justify-center text-(--pb-text-low)">
                    {trailing}
                </span>
            )}
        </Root>
    );
}
