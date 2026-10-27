import type { KeyboardEvent } from 'react';
import { ChevronRightIcon, TrashIcon } from '../Icons';
import { type VisibilityMode, VisibilityToggle } from '../VisibilityToggle';
import { isRowActivationKey } from './rowActivation';

/**
 * Generic list-of-entries renderer used by Places / Routes / Ranges panels. Keeps the per-panel
 * components tiny — they only have to map their entry shape to a label + optional subtitle, and
 * provide the visibility/delete/show callbacks.
 */
export type EntryListItem = {
    id: string;
    label: string;
    subtitle?: string;
    timestamp: number;
};

type EntryListProps = {
    items: EntryListItem[];
    emptyMessage: string;
    /** Open the details panel for this entry. */
    onShowDetails: (id: string) => void;
    /** Permanently remove this entry from agent state. */
    onDelete: (id: string) => void;
    /** Read this entry's visibility-mode (managed by the parent rail). */
    visibility: (id: string) => VisibilityMode;
    onVisibilityChange: (id: string, mode: VisibilityMode) => void;
};

const formatTimestamp = (ts: number): string =>
    new Date(ts).toLocaleString(undefined, { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' });

export function EntryList({
    items,
    emptyMessage,
    onShowDetails,
    onDelete,
    visibility,
    onVisibilityChange,
}: EntryListProps) {
    if (items.length === 0) {
        return <div className="px-3 py-6 text-center text-[11px] text-(--ui-text-low-em)">{emptyMessage}</div>;
    }
    const sorted = [...items].sort((a, b) => b.timestamp - a.timestamp);
    const handleKeyDown = (event: KeyboardEvent<HTMLLIElement>, id: string) => {
        if (!isRowActivationKey(event)) return;
        event.preventDefault();
        onShowDetails(id);
    };
    return (
        <ul className="flex flex-col gap-2">
            {sorted.map((item) => (
                <li
                    key={item.id}
                    role="button"
                    tabIndex={0}
                    aria-label={`Open details for ${item.label}`}
                    onClick={() => onShowDetails(item.id)}
                    onKeyDown={(event) => handleKeyDown(event, item.id)}
                    className="flex cursor-pointer flex-col gap-2 rounded-(--ui-rounded-5) border border-(--ui-border-low-em) bg-(--ui-surface-1) p-3 transition-colors hover:border-(--ui-border-high-em) hover:bg-(--ui-surface-2) focus:outline-none focus-visible:border-(--ui-surface-brand-red) focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--ui-surface-brand-red)_30%,transparent)]"
                >
                    <div className="flex items-start gap-2">
                        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                            <span className="truncate text-[13px] font-medium text-(--ui-text-high-em)">
                                {item.label}
                            </span>
                            <span className="text-[11px] text-(--ui-text-low-em)">
                                <span className="font-mono">{item.id}</span>
                                {item.subtitle && <span> · {item.subtitle}</span>}
                                <span> · {formatTimestamp(item.timestamp)}</span>
                            </span>
                        </div>
                        <ChevronRightIcon className="mt-0.5 shrink-0 text-[14px] text-(--ui-text-low-em)" />
                    </div>
                    <div className="flex items-center justify-between gap-2" onClick={(e) => e.stopPropagation()}>
                        <VisibilityToggle
                            value={visibility(item.id)}
                            onChange={(mode) => onVisibilityChange(item.id, mode)}
                        />
                        <button
                            type="button"
                            onClick={() => onDelete(item.id)}
                            aria-label={`Delete ${item.label}`}
                            title="Delete from state"
                            className="flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-(--ui-rounded-5) text-(--ui-text-med-em) transition-colors hover:bg-[color-mix(in_srgb,var(--ui-surface-brand-red)_12%,transparent)] hover:text-(--ui-surface-brand-red)"
                        >
                            <TrashIcon className="text-[14px]" />
                        </button>
                    </div>
                </li>
            ))}
        </ul>
    );
}
