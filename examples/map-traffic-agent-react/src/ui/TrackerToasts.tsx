import type { TrackerToast } from '../hooks/useTrackers';
import { FeedRow } from './components';
import { AlertGlyph } from './trackerIcons';

export type TrackerToastsProps = {
    toasts: readonly TrackerToast[];
    onDismiss: (seq: number) => void;
};

/**
 * Alert toasts that float over the map top-center. One card per `opened` alert a tracker fires;
 * auto-dismiss after a TTL (managed by `useTrackers`), or × to dismiss early. Reuses the shared
 * `FeedRow` so a toast and a feed row share anatomy (type icon + title + 2-line summary + status line),
 * with the alert accent as a left border.
 */
export function TrackerToasts({ toasts, onDismiss }: TrackerToastsProps) {
    if (toasts.length === 0) return null;
    return (
        <div
            className="pointer-events-none absolute top-3 left-1/2 z-(--sdk-z-tooltip) flex w-[300px] max-w-[90vw] -translate-x-1/2 flex-col gap-2"
            aria-live="assertive"
        >
            {toasts.map((toast) => (
                <div
                    key={toast.seq}
                    className="pointer-events-auto flex items-start overflow-hidden rounded-(--sdk-radius-10) border border-(--sdk-border-low) border-l-4 border-l-(--sdk-color-error) bg-(--sdk-surface-0) shadow-(--sdk-shadow-e4) backdrop-blur-md"
                    role="status"
                >
                    <div className="min-w-0 flex-auto">
                        <FeedRow
                            icon={<AlertGlyph />}
                            iconColor="var(--sdk-color-error)"
                            title={toast.trackerName}
                            description={toast.summary}
                            tag={{ label: toast.kind, accent: 'var(--sdk-color-error)' }}
                            at={toast.at}
                        />
                    </div>
                    <button
                        type="button"
                        className="mt-2 mr-2 shrink-0 cursor-pointer border-0 bg-transparent px-1 text-(--sdk-text-low) transition-colors hover:text-(--sdk-text-high)"
                        onClick={() => onDismiss(toast.seq)}
                        aria-label="Dismiss"
                    >
                        ×
                    </button>
                </div>
            ))}
        </div>
    );
}
