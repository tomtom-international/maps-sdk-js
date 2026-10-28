import type { DatasetMode } from '@tomtom-org/maps-sdk-plugin-agent-toolkit';

type DatasetModeToggleProps = {
    value: DatasetMode;
    onChange: (mode: DatasetMode) => void;
};

const OPTIONS: { mode: DatasetMode; label: string; title: string }[] = [
    { mode: 'multiple', label: 'Multiple', title: 'Overlay multiple datasets on the map' },
    { mode: 'single', label: 'Single', title: 'Keep only the latest dataset — older ones are dropped' },
];

// Two-state segmented control matching VisibilityToggle's chrome, used to flip a state slice
// between `multiple` (overlay) and `single` (latest-only) dataset mode.
export function DatasetModeToggle({ value, onChange }: DatasetModeToggleProps) {
    return (
        <div
            role="radiogroup"
            aria-label="Dataset mode"
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
