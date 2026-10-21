import type { EntryMode } from '@tomtom-org/maps-sdk-plugin-agent-toolkit';

type EntryModeToggleProps = {
    value: EntryMode;
    onChange: (mode: EntryMode) => void;
};

const OPTIONS: { mode: EntryMode; label: string; title: string }[] = [
    { mode: 'multiple', label: 'Multiple', title: 'Overlay multiple entries on the map' },
    { mode: 'single', label: 'Single', title: 'Keep only the latest entry — older ones are dropped' },
];

// Two-state segmented control matching VisibilityToggle's chrome, used to flip a state slice
// between `multiple` (overlay) and `single` (latest-only) entry mode.
export function EntryModeToggle({ value, onChange }: EntryModeToggleProps) {
    return (
        <div
            role="radiogroup"
            aria-label="Entry mode"
            className="inline-flex overflow-hidden rounded-(--ui-rounded-5) border border-(--ui-border-low-em) bg-(--ui-surface-0)"
        >
            {OPTIONS.map(({ mode, label, title }) => {
                const isActive = mode === value;
                const base = 'px-2 py-1 text-[10px] leading-none transition-colors cursor-pointer font-medium';
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
                        {label}
                    </button>
                );
            })}
        </div>
    );
}
