import { type CSSProperties, type ReactNode, useEffect, useState } from 'react';
import { playbook, tint } from '../lib/playbook-tokens';

/**
 * Shared styling primitives for the map-overlay panels, built on the `playbook` tokens (see
 * playbook-tokens.ts) — no raw design-system variables live here. These replace markup that had been
 * re-authored inline in each panel (card shells, status pills, icon buttons, KPI tiles, …).
 */

// ── Typography (type scale) ──────────────────────────────────────────
export const titleStyle: CSSProperties = {
    fontFamily: playbook.font.headings, // Gilroy
    fontWeight: playbook.weight.bold,
    fontSize: '16px',
    lineHeight: '24px',
    color: playbook.text.highEm,
};
export const captionStyle: CSSProperties = {
    fontFamily: playbook.font.body,
    fontSize: '12px',
    lineHeight: '16px',
    color: playbook.text.lowEm,
};

// ── Card shell ──────────────────────────────────────────────────────────────
/** Floating-card chrome shared by every overlay panel — surface-0, hairline border, e4 elevation,
 *  blurred backdrop. Compose with per-panel layout/sizing classes. Uses the playbook (`--pb-*`) tokens. */
export const cardShellClass =
    'rounded-(--pb-radius-10) border border-(--pb-border-low) bg-(--pb-surface-0) shadow-(--pb-shadow-e4) backdrop-blur-md';

// ── Status tag ───────────────────────────────────────────────────────────────
export type StatusTone = 'error' | 'warning' | 'success' | 'info' | 'neutral';

const TONE_COLOR: Record<StatusTone, string> = {
    error: playbook.status.error,
    warning: playbook.status.warning,
    success: playbook.status.success,
    info: playbook.status.info,
    neutral: playbook.text.medEm,
};

/**
 * Status pill ("status tag") — a coloured label on a tint of its own colour. Pick a semantic
 * `tone` or pass a raw `accent` for a domain value (the severity ramp). Mirrors the
 * "Major delay / Minor delay / Clearing" tags.
 */
export function StatusTag({
    children,
    tone = 'neutral',
    accent,
    uppercase,
    className = '',
}: {
    children: ReactNode;
    tone?: StatusTone;
    accent?: string;
    uppercase?: boolean;
    className?: string;
}) {
    const color = accent ?? TONE_COLOR[tone];
    return (
        <span
            className={`inline-flex items-center rounded-full px-1.5 py-px text-[10px] font-semibold ${uppercase ? 'uppercase' : ''} ${className}`}
            style={{ color, backgroundColor: tint(color), fontFamily: playbook.font.body }}
        >
            {children}
        </span>
    );
}

/** Small neutral metadata chip — bordered surface-1 pill for counts/labels (e.g. the cluster count). */
export function MetaChip({ children, className = '' }: { children: ReactNode; className?: string }) {
    return (
        <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${className}`}
            style={{
                color: playbook.text.medEm,
                background: playbook.surface.surface1,
                border: `1px solid ${playbook.border.lowEm}`,
            }}
        >
            {children}
        </span>
    );
}

// ── Icon button ───────────────────────────────────────────────────────────────
export type IconButtonSize = 'sm' | 'md';
export type IconButtonVariant = 'ghost' | 'outline';

const ICON_SIZE: Record<IconButtonSize, string> = { sm: 'h-6 w-6', md: 'h-7 w-7' };

/**
 * Square icon button used across panel headers and chrome. `active`/`expanded` reflect a pressed
 * state (aria + raised surface). Colours come from playbook via inline CSS vars so the Tailwind
 * hover/focus utilities can drive the pseudo-states. Replaces the icon buttons each panel hand-rolled.
 */
export function IconButton({
    label,
    onClick,
    children,
    size = 'md',
    variant = 'ghost',
    active,
    expanded,
    disabled,
    className = '',
}: {
    label: string;
    onClick: () => void;
    children: ReactNode;
    size?: IconButtonSize;
    variant?: IconButtonVariant;
    active?: boolean;
    expanded?: boolean;
    disabled?: boolean;
    className?: string;
}) {
    const pressed = active || expanded;
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            aria-label={label}
            aria-pressed={active}
            aria-expanded={expanded}
            title={label}
            className={`inline-flex shrink-0 cursor-pointer items-center justify-center rounded-(--pb-radius) leading-none transition-colors hover:bg-(--pb-hover) hover:text-(--pb-hovertext) focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-(--pb-focus) disabled:cursor-not-allowed disabled:opacity-40 ${ICON_SIZE[size]} ${className}`}
            style={{
                color: playbook.text.medEm,
                background: pressed ? playbook.surface.surface1 : 'transparent',
                border: variant === 'outline' ? `1px solid ${playbook.border.lowEm}` : '0',
                ['--pb-radius' as string]: playbook.radius.sm,
                ['--pb-hover' as string]: playbook.surface.surface1,
                ['--pb-hovertext' as string]: playbook.text.highEm,
                ['--pb-focus' as string]: playbook.text.brand,
            }}
        >
            {children}
        </button>
    );
}

// ── Note banner ───────────────────────────────────────────────────────────────
/** Subtle info banner (e.g. the "N other incidents here" note) — surface-1 box with hairline border. */
export function NoteBanner({ children, className = '' }: { children: ReactNode; className?: string }) {
    return (
        <div
            className={`p-2 text-center text-[12px] leading-4 ${className}`}
            style={{
                color: playbook.text.medEm,
                background: playbook.surface.surface1,
                border: `1px solid ${playbook.border.lowEm}`,
                borderRadius: playbook.radius.sm,
            }}
        >
            {children}
        </div>
    );
}

// ── Severity dot ───────────────────────────────────────────────────────────────
/** Small severity dot keyed to the canonical severity ramp. */
export function SeverityDot({ color, size = 'md', title }: { color: string; size?: 'sm' | 'md'; title?: string }) {
    return (
        <span
            title={title}
            className={`shrink-0 rounded-full ${size === 'sm' ? 'h-2 w-2' : 'h-2.5 w-2.5'}`}
            style={{ background: color }}
        />
    );
}

// ── KPI tile ───────────────────────────────────────────────────────────────────
export type KpiTone = 'error' | 'info' | 'plain';

/**
 * A metric tile ("Current viewport / Summary" + the "Jam" Severity/Delay tiles): a big value over
 * a small label, on a tint of its tone (`error` red, `info` blue) or a neutral surface. `labelTop` puts
 * the label above the value (the incident-details tiles read "Severity" → "Major").
 */
export function KpiTile({
    label,
    value,
    tone = 'plain',
    accent: accentOverride,
    labelTop,
}: {
    label: string;
    value: ReactNode;
    tone?: KpiTone;
    /** Explicit accent colour (e.g. the severity ramp), overriding `tone`. */
    accent?: string;
    labelTop?: boolean;
}) {
    const accent =
        accentOverride ?? (tone === 'error' ? playbook.status.error : tone === 'info' ? playbook.status.info : null);
    const labelEl = (
        <div
            className="text-[11px] tracking-wide"
            style={{ color: accent ?? playbook.text.lowEm, fontFamily: playbook.font.body }}
        >
            {label}
        </div>
    );
    const valueEl = (
        <div
            className="text-[20px] leading-6 font-bold"
            style={{ color: accent ?? playbook.text.highEm, fontFamily: playbook.font.headings }}
        >
            {value}
        </div>
    );
    return (
        <div
            className="flex flex-col gap-0.5 px-3 py-2"
            style={{
                borderRadius: playbook.radius.sm,
                background: accent ? tint(accent, 8) : playbook.surface.surface1,
                border: `1px solid ${accent ? tint(accent, 30) : playbook.border.lowEm}`,
            }}
        >
            {labelTop ? (
                <>
                    {labelEl}
                    {valueEl}
                </>
            ) : (
                <>
                    {valueEl}
                    {labelEl}
                </>
            )}
        </div>
    );
}

// ── Panel card ───────────────────────────────────────────────────────────────
function Chevrons() {
    // Collapse glyph — two chevrons meeting (collapse/expand handle).
    return (
        <svg
            viewBox="0 0 16 16"
            width="14"
            height="14"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            aria-hidden="true"
        >
            <path d="M4 6l4-3 4 3M4 10l4 3 4-3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

/**
 * The overlay-panel shell: a card (cardShellStyle) with a title-row header carrying an optional
 * count chip, a collapse toggle, and a close ✕ — the control pair every Notification-Center panel shows.
 * The parent renders/unmounts the card (close → parent clears its data); the card owns collapsed state.
 */
export function PanelCard({
    title,
    count,
    headerMeta,
    onClose,
    onCollapsedChange,
    defaultCollapsed = false,
    headerClassName = '',
    className = '',
    children,
    'aria-label': ariaLabel,
}: {
    title: ReactNode;
    count?: ReactNode;
    /** Free-form metadata rendered right-aligned in the header, before the collapse toggle
     *  (e.g. the monitor's "updated 18s ago · 3" status line). */
    headerMeta?: ReactNode;
    onClose?: () => void;
    onCollapsedChange?: (collapsed: boolean) => void;
    defaultCollapsed?: boolean;
    headerClassName?: string;
    className?: string;
    children: ReactNode;
    'aria-label': string;
}) {
    const [collapsed, setCollapsed] = useState(defaultCollapsed);
    useEffect(() => setCollapsed(defaultCollapsed), [defaultCollapsed]);
    const toggle = () => {
        const next = !collapsed;
        setCollapsed(next);
        onCollapsedChange?.(next);
    };
    return (
        <section
            aria-label={ariaLabel}
            // Width is set by each consumer (the rail panels share a fixed 280px per the design spec; the
            // floating IncidentDetailsPanel is wider) — kept out of the base so two arbitrary `w-[…]`
            // classes never collide here.
            className={`pointer-events-auto flex flex-col overflow-hidden ${cardShellClass} ${className}`}
        >
            <header
                className={`flex shrink-0 items-center gap-2 px-3 py-2 ${headerClassName}`}
                style={{ borderBottom: collapsed ? '0' : `1px solid ${playbook.border.lowEm}` }}
            >
                <h2 style={titleStyle} className="m-0 min-w-0 flex-1 truncate">
                    {title}
                </h2>
                {count != null && <MetaChip>{count}</MetaChip>}
                {headerMeta != null && <div className="shrink-0">{headerMeta}</div>}
                <IconButton
                    label={collapsed ? 'Expand panel' : 'Collapse panel'}
                    onClick={toggle}
                    size="sm"
                    expanded={!collapsed}
                >
                    <Chevrons />
                </IconButton>
                {onClose && (
                    <IconButton label="Close panel" onClick={onClose} size="sm" className="text-[16px]">
                        ✕
                    </IconButton>
                )}
            </header>
            {!collapsed && children}
        </section>
    );
}
