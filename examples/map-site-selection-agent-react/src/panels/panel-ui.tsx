import { type ReactNode, useEffect, useState } from 'react';
import { playbook } from './playbook-tokens';

// Shared Playbook-styled building blocks for the map overlay panels. Tokens come from
// playbook-tokens.ts (pinned from ~/playbook-create); no raw values live here — except the
// data-viz score colours, which the design system carries as raw hex (not surface tokens).

export const titleStyle: React.CSSProperties = {
    fontFamily: playbook.font.headings, // Gilroy — titles are wayfinding
    fontWeight: 700,
    fontSize: '14px', // typography/title-3
    lineHeight: '20px',
    color: playbook.text.highEm,
};

// Figma "title-2" (16/24 bold, primary font, high-emphasis text) — the panel section headers and row
// labels. A Tailwind class rather than a style object because it composes with layout utilities
// (`truncate`, `overflow-hidden`) at the call sites; centralised here so the next type tweak is one edit.
export const title2Class =
    'font-(family-name:--pb-font-primary) text-[16px] leading-[24px] font-bold text-(--pb-text-high)';

// Playbook type scale as composable classes; colour stays at the call site (it varies per use).
export const title1Class = 'font-(family-name:--pb-font-primary) text-[20px] leading-[24px] font-bold';
export const title3Class = 'font-(family-name:--pb-font-primary) text-[14px] leading-[20px] font-bold';
export const title4Class = 'font-(family-name:--pb-font-primary) text-[12px] leading-[16px] font-bold';
export const captionClass = 'font-(family-name:--pb-font-secondary) text-[12px] leading-[16px] font-normal';

export const captionStyle: React.CSSProperties = {
    fontFamily: playbook.font.body, // caption-m
    fontSize: '12px',
    lineHeight: '16px',
    color: playbook.text.lowEm,
};

// Score → colour scale from the Figma shortlist (title-1 score + matching bar): green high, blue
// mid, grey low. Carried as raw hex because the design system exposes these as data-viz values, not
// surface tokens.
export const SCORE_GREEN = '#4ca262';
export const SCORE_BLUE = '#3c5c98';
export const SCORE_GREY = '#5c5c5c';

export const scoreColor = (value: number): string =>
    value >= 60 ? SCORE_GREEN : value >= 30 ? SCORE_BLUE : SCORE_GREY;

// Non-interactive status tag (Figma "status tag" — square-ish 5px radius, surface-0 fill, low-em
// border, title-4). Used for the footer chip rows ("Not scored", legends).
export function StatusTag({ children }: { children: ReactNode }) {
    return (
        <span
            style={{
                fontFamily: playbook.font.headings,
                fontWeight: 700,
                fontSize: '12px',
                lineHeight: '16px',
                color: playbook.text.highEm,
                background: playbook.surface.surface0,
                border: `1px solid ${playbook.border.lowEm}`,
                borderRadius: '5px',
                padding: '4px 8px',
                whiteSpace: 'nowrap',
            }}
        >
            {children}
        </span>
    );
}

// Rank chip (Figma "Number" — 24px, 6px radius, primary-accent tint, title-3). null = excluded.
export function RankBadge({ n }: { n: number | null }) {
    return (
        <span
            aria-hidden
            className="flex size-6 shrink-0 items-center justify-center rounded-[6px] font-(family-name:--pb-font-primary) text-[14px] leading-[20px] font-bold"
            style={{
                background: 'rgba(0,0,0,0.04)', // surface/primary-accent
                color: n === null ? playbook.text.lowEm : playbook.text.highEm,
            }}
        >
            {n ?? '–'}
        </span>
    );
}

// 0-100 score bar — 8px track on surface-1, fill defaults to the darkest neutral but takes a colour
// (score scale, cannibalization pink, pocket hue) so the bar matches its headline number.
export function ScoreBar({ value, color }: { value: number; color?: string }) {
    const clamped = Math.max(0, Math.min(100, value));
    return (
        <div
            role="img"
            aria-label={`Score ${value} out of 100`}
            className="h-2 w-full overflow-hidden"
            style={{ background: playbook.surface.surface1, borderRadius: '5px' }}
        >
            <div
                className="h-full"
                style={{ width: `${clamped}%`, background: color ?? playbook.surface.highEm, borderRadius: '5px' }}
            />
        </div>
    );
}

const breakdownRowText: React.CSSProperties = {
    fontFamily: playbook.font.headings,
    fontWeight: 700,
    fontSize: '14px',
    lineHeight: '20px',
};

// Collapsible "Score breakdown ⌄" disclosure carrying label/value rows. Keeps the glass-box detail
// one tap away instead of always-on text.
export function ScoreBreakdown({ rows }: { rows: { label: string; value: string; muted?: boolean }[] }) {
    const [open, setOpen] = useState(false);
    if (rows.length === 0) return null;
    return (
        <div className="flex flex-col gap-1.5">
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className="flex w-fit cursor-pointer items-center gap-0.5 border-0 bg-transparent p-0"
                style={{
                    fontFamily: playbook.font.headings,
                    fontWeight: 700,
                    fontSize: '12px',
                    lineHeight: '16px',
                    color: playbook.text.medEm,
                }}
            >
                Score breakdown
                <svg
                    viewBox="0 0 24 24"
                    width={16}
                    height={16}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ transform: open ? 'rotate(180deg)' : undefined, transition: 'transform 120ms' }}
                >
                    <path d="M6 9l6 6 6-6" />
                </svg>
            </button>
            {open && (
               <div
                    className="-mr-4 -ml-12 flex flex-col gap-1 px-4 py-1.5"
                    style={{ background: playbook.surface.surface1 }}
                >
                    {rows.map((row) => (
                        <div key={row.label} className="flex items-center justify-between gap-2">
                            <span style={{ ...breakdownRowText, color: playbook.text.medEm }}>{row.label}</span>
                            <span
                                style={{
                                    ...breakdownRowText,
                                    color: row.muted ? playbook.text.lowEm : playbook.text.highEm,
                                }}
                            >
                                {row.value}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// Two-ended weight slider (Figma "Switch"): left % … custom track … right %, with the two factor
// names beneath. The native range input sits invisibly on top of the styled track for interaction.
export function SplitSlider({
    leftLabel,
    rightLabel,
    leftPct,
    onChange,
}: {
    leftLabel: string;
    rightLabel: string;
    leftPct: number;
    onChange: (leftPct: number) => void;
}) {
    const clamped = Math.max(0, Math.min(100, Math.round(leftPct)));
    const boldSmall: React.CSSProperties = {
        fontFamily: playbook.font.headings,
        fontWeight: 700,
        fontSize: '14px',
        lineHeight: '20px',
        color: playbook.text.highEm,
    };
    return (
        <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-3">
                <span style={boldSmall}>{clamped}%</span>
                <div className="relative flex h-4 flex-1 items-center">
                    <div
                        className="h-1.5 w-full overflow-hidden"
                        style={{ background: playbook.surface.surface1, borderRadius: '5px' }}
                    >
                        <div
                            className="h-full"
                            style={{ width: `${clamped}%`, background: playbook.surface.highEm, borderRadius: '5px' }}
                        />
                    </div>
                    <span
                        aria-hidden
                        className="absolute size-4 -translate-x-1/2 rounded-full"
                        style={{
                            left: `${clamped}%`,
                            background: playbook.surface.surface0,
                            border: `1px solid ${playbook.border.lowEm}`,
                            boxShadow: '1px 1px 4px 0px rgba(0,0,0,0.2)',
                        }}
                    />
                    <input
                        type="range"
                        min={0}
                        max={100}
                        value={clamped}
                        onChange={(e) => onChange(Number(e.target.value))}
                        aria-label={`${leftLabel} versus ${rightLabel} weight`}
                        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                    />
                </div>
                <span style={boldSmall}>{100 - clamped}%</span>
            </div>
            <div className="flex items-center justify-between">
                <span style={{ ...titleStyle, fontSize: '12px', lineHeight: '16px', color: playbook.text.medEm }}>
                    {leftLabel}
                </span>
                <span style={{ ...titleStyle, fontSize: '12px', lineHeight: '16px', color: playbook.text.medEm }}>
                    {rightLabel}
                </span>
            </div>
        </div>
    );
}

// Secondary xs button with a refresh glyph (Figma "Reset"). Used to drop a live weight override.
export function ResetButton({ onClick }: { onClick: () => void }) {
    const [focused, setFocused] = useState(false);
    return (
        <button
            type="button"
            onClick={onClick}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            className="flex shrink-0 items-center gap-1 transition-colors hover:bg-(--pb-hover)"
            style={{
                fontFamily: playbook.font.headings,
                fontWeight: 700,
                fontSize: '12px',
                lineHeight: '16px',
                color: playbook.text.highEm,
                background: playbook.surface.surface0,
                border: `1px solid ${playbook.border.medEm}`,
                borderRadius: '40px',
                padding: '3px 8px',
                outline: 'none',
                boxShadow: focused ? playbook.outline.focusPrimary : undefined,
                ['--pb-hover' as string]: playbook.surface.surface1,
            }}
        >
            <svg viewBox="0 0 12 12" width={14} height={14} fill="currentColor" aria-hidden>
                <path d="M8.77674 3.86934C9.24577 4.48059 9.5 5.22953 9.5 6H10.5C10.5 5.0094 10.1731 4.04647 9.57009 3.26057C8.96705 2.47468 8.12154 1.90972 7.16469 1.65334C6.20784 1.39695 5.19312 1.46346 4.27792 1.84254C3.80659 2.03778 3.37522 2.3103 3 2.6459V2H2V4.5H4.5V3.5H3.55051C3.86818 3.18876 4.24436 2.93884 4.66061 2.76642C5.37243 2.47158 6.16165 2.41985 6.90587 2.61926C7.65008 2.81867 8.3077 3.25808 8.77674 3.86934Z" />
                <path d="M3.22326 8.13067C2.75423 7.51941 2.5 6.77047 2.5 6H1.5C1.5 6.99061 1.82687 7.95353 2.42991 8.73943C3.03295 9.52533 3.87846 10.0903 4.83531 10.3467C5.79216 10.6031 6.80688 10.5365 7.72208 10.1575C8.19341 9.96223 8.62478 9.68971 9 9.3541V10H10V7.5H7.5V8.5H8.44949C8.13182 8.81125 7.75564 9.06116 7.33939 9.23358C6.62757 9.52843 5.83835 9.58015 5.09413 9.38074C4.34992 9.18133 3.6923 8.74192 3.22326 8.13067Z" />
            </svg>
            Reset
        </button>
    );
}

// Full-bleed surface-1 footer with a low-em heading (Figma "Stacked labels" / area make-up). Sits
// flush to the card's rounded bottom (parent card clips).
export function FooterSection({
    title,
    children,
    titleStyle: titleOverride,
}: {
    title: string;
    children: ReactNode;
    titleStyle?: React.CSSProperties;
}) {
    return (
        <div className="flex flex-col gap-2 bg-(--pb-surface-1) px-4 py-3">
            <span
                style={{
                    fontFamily: playbook.font.headings,
                    fontWeight: 700,
                    fontSize: '12px',
                    lineHeight: '16px',
                    color: playbook.text.lowEm,
                    ...titleOverride,
                }}
            >
                {title}
            </span>
            {children}
        </div>
    );
}

// Subtle info banner (e.g. honesty warnings) — info-accent surface per the design system.
export function NoteBanner({ children }: { children: ReactNode }) {
    return (
        <div
            style={{
                ...captionStyle,
                color: playbook.text.medEm,
                background: playbook.surface.infoAccent,
                border: `1px solid ${playbook.border.lowEm}`,
                borderRadius: '8px',
                padding: '6px 8px',
            }}
        >
            {children}
        </div>
    );
}

const HEADER_ICON = {
    viewBox: '0 0 24 24',
    width: 16,
    height: 16,
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
};

// 32px tertiary icon button for the card header actions (Figma "button" size=sm, type=tertiary).
function HeaderIconButton({ label, onClick, children }: { label: string; onClick: () => void; children: ReactNode }) {
    return (
        <button
            type="button"
            aria-label={label}
            onClick={onClick}
            className="flex size-8 shrink-0 items-center justify-center rounded-[8px] text-(--pb-text-high) transition-colors hover:bg-(--pb-surface-1)"
        >
            {children}
        </button>
    );
}

/**
 * Card chrome for a map-overlay panel: a Playbook surface-0 card (e3 elevation) with the shared
 * title-2 header (collapse + close). Children render flush — each panel owns its own section padding
 * so it can bleed surface-1 footers to the rounded edge (the card clips).
 */
export function PanelShell({
    title,
    onClose,
    children,
    expanded,
}: {
    title: string;
    onClose: () => void;
    children: ReactNode;
    /** When a newer panel takes over this auto-collapses to its header (and re-expands when it becomes
     * the active panel again). Manual toggle still works between those transitions. Omit for always-open. */
    expanded?: boolean;
}) {
    const [collapsed, setCollapsed] = useState(expanded !== undefined ? !expanded : false);
    useEffect(() => {
        if (expanded !== undefined) setCollapsed(!expanded);
    }, [expanded]);
    return (
        <section
            aria-label={title}
            className="pointer-events-auto w-full overflow-clip rounded-[10px] border border-(--pb-border-low) bg-(--pb-surface-0) shadow-(--pb-shadow-e3)"
        >
            <header className="flex min-h-[52px] items-center gap-2 border-b border-(--pb-border-base) py-1 pr-2 pl-4">
                {/* the `!` beats the template css's un-layered `h2 { font-size }` rule */}
                <h2 className="flex-1 truncate font-(family-name:--pb-font-primary) text-[16px]! leading-[24px] font-bold text-(--pb-text-high)">
                    {title}
                </h2>
                <div className="flex shrink-0 items-center gap-1">
                    <HeaderIconButton
                        label={collapsed ? 'Expand panel' : 'Collapse panel'}
                        onClick={() => setCollapsed((v) => !v)}
                    >
                        <svg viewBox="0 0 24 24" width={16} height={16} fill="currentColor" aria-hidden>
                            {collapsed ? (
                                <>
                                    <path d="M5.11621 7L12 0.116211L18.8838 7L17.1162 8.76758L12 3.65137L6.88379 8.76758L5.11621 7Z" />
                                    <path d="M18.8838 17L12 23.8838L5.11621 17L6.88379 15.2324L12 20.3486L17.1162 15.2324L18.8838 17Z" />
                                </>
                            ) : (
                                <>
                                    <path d="M18.8838 3.88379L12 10.7676L5.11621 3.88379L6.88379 2.11621L12 7.23242L17.1162 2.11621L18.8838 3.88379Z" />
                                    <path d="M5.11621 20.1162L12 13.2324L18.8838 20.1162L17.1162 21.8838L12 16.7676L6.88379 21.8838L5.11621 20.1162Z" />
                                </>
                            )}
                        </svg>
                    </HeaderIconButton>
                    <HeaderIconButton label="Close panel" onClick={onClose}>
                        <svg {...HEADER_ICON}>
                            <path d="M18 6 6 18" />
                            <path d="M6 6l12 12" />
                        </svg>
                    </HeaderIconButton>
                </div>
            </header>
            {!collapsed && <div className="flex flex-col">{children}</div>}
        </section>
    );
}
