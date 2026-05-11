import type { FC } from 'react';

type Props = {
    count: number;
    currentIndex: number;
    reason?: string;
    onPrev: () => void;
    onNext: () => void;
    onClear: () => void;
};

const truncate = (s: string, n: number) => (s.length <= n ? s : `${s.slice(0, n - 1)}…`);

export const FocusChip: FC<Props> = ({ count, currentIndex, reason, onPrev, onNext, onClear }) => {
    const label = reason ? truncate(reason, 60) : '';
    const showNav = count > 1;
    const position = showNav ? `${currentIndex + 1} / ${count}` : `${count}`;
    return (
        <div className="focus-chip">
            <span className="focus-chip-text">
                <strong>Focus:</strong> {position} incident{count === 1 ? '' : 's'}
                {label ? <span className="focus-chip-reason"> · {label}</span> : null}
            </span>
            {showNav && (
                <span className="focus-chip-nav">
                    <button
                        type="button"
                        className="focus-chip-nav-btn"
                        onClick={onPrev}
                        aria-label="Previous focused incident"
                    >
                        ‹
                    </button>
                    <button
                        type="button"
                        className="focus-chip-nav-btn"
                        onClick={onNext}
                        aria-label="Next focused incident"
                    >
                        ›
                    </button>
                </span>
            )}
            <button type="button" className="focus-chip-close" onClick={onClear} aria-label="Clear focus">
                ×
            </button>
        </div>
    );
};
