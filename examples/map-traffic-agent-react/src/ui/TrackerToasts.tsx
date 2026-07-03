import type { TrackerToast } from '../hooks/useTrackers';
import { cardShellClass, FeedRow, IconButton } from './components';
import { AlertGlyph } from './trackerIcons';

export type TrackerToastsProps = {
    toasts: readonly TrackerToast[];
    onDismiss: (seq: number) => void;
};

/**
 * Alert toasts that float over the map's top-right corner. One card per `opened` alert a tracker fires;
 * auto-dismiss after a TTL (managed by `useTrackers`), or × to dismiss early. Reuses the shared
 * `FeedRow` so a toast and a feed row share anatomy (type icon + title + 2-line summary + status line),
 * with the alert accent as a left border.
 */
export function TrackerToasts({ toasts, onDismiss }: TrackerToastsProps) {
    if (toasts.length === 0) return null;
    return (
        <div
            className="pointer-events-none absolute top-3 right-3 z-(--pb-z-tooltip) flex w-[300px] max-w-[90vw] flex-col gap-2"
            aria-live="assertive"
        >
            {toasts.map((toast) => (
                <div
                    key={toast.seq}
                    className={`pointer-events-auto flex items-start overflow-hidden border-l-4 border-l-(--pb-color-error) ${cardShellClass}`}
                    role="status"
                >
                    <div className="min-w-0 flex-auto">
                        <FeedRow
                            icon={<AlertGlyph />}
                            iconColor="var(--pb-color-error)"
                            title={toast.trackerName}
                            description={toast.summary}
                            tag={{ label: toast.kind, accent: 'var(--pb-color-error)' }}
                            at={toast.at}
                        />
                    </div>
                    <IconButton
                        label="Dismiss"
                        onClick={() => onDismiss(toast.seq)}
                        size="sm"
                        className="mt-1.5 mr-1.5 text-[16px]"
                    >
                        ×
                    </IconButton>
                </div>
            ))}
        </div>
    );
}
