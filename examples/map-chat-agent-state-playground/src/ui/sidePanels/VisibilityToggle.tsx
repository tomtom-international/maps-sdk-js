import { EyeIcon, EyeOffIcon, SelectionIcon } from './Icons';

/**
 * Per-entry visibility policy. Tracked at the rail level (not in agent-toolkit state) since
 * it's a UI concern: how this entry should behave relative to the active selection.
 *
 * - `on-selection`: shown only while it's the active entry in the details panel. (default)
 * - `always-shown`: kept on the map regardless of which entry is active.
 * - `always-hidden`: never auto-shown, even when activated.
 */
export type VisibilityMode = 'on-selection' | 'always-shown' | 'always-hidden';

type VisibilityToggleProps = {
    value: VisibilityMode;
    onChange: (mode: VisibilityMode) => void;
};

const OPTIONS: { mode: VisibilityMode; label: string; title: string; Icon: typeof EyeIcon }[] = [
    { mode: 'on-selection', label: 'Selection', title: 'Show only while selected', Icon: SelectionIcon },
    { mode: 'always-shown', label: 'Pinned', title: 'Always show on the map', Icon: EyeIcon },
    { mode: 'always-hidden', label: 'Hidden', title: 'Never show automatically', Icon: EyeOffIcon },
];

/**
 * Compact 3-state segmented control for an entry's visibility policy. The active option uses
 * the SDK's `--ui-surface-brand-red` accent so the choice stays legible at the small entry-row
 * font size.
 */
export function VisibilityToggle({ value, onChange }: VisibilityToggleProps) {
    return (
        <div
            role="radiogroup"
            aria-label="Visibility"
            className="inline-flex overflow-hidden rounded-(--ui-rounded-5) border border-(--ui-border-low-em) bg-(--ui-surface-0)"
        >
            {OPTIONS.map(({ mode, label, title, Icon }) => {
                const isActive = mode === value;
                const base =
                    'flex items-center gap-1 px-1.5 py-1 text-[10px] leading-none transition-colors cursor-pointer';
                const tone = isActive
                    ? 'bg-(--ui-surface-brand-red) text-(--ui-text-white)'
                    : 'text-(--ui-text-med-em) hover:bg-(--ui-surface-1) hover:text-(--ui-text-high-em)';
                return (
                    <button
                        key={mode}
                        type="button"
                        role="radio"
                        aria-checked={isActive}
                        title={title}
                        onClick={() => onChange(mode)}
                        className={`${base} ${tone}`}
                    >
                        <Icon className="text-[12px]" />
                        <span>{label}</span>
                    </button>
                );
            })}
        </div>
    );
}
