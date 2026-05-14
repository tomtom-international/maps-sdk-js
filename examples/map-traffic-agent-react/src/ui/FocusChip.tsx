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

const NAV_BTN_CLASS =
    'h-[22px] min-w-[22px] cursor-pointer rounded-(--sdk-radius-5) border border-(--sdk-border-low) bg-transparent px-1 text-[16px] leading-none text-(--sdk-text-medium) hover:border-(--sdk-border-high) hover:text-(--sdk-text-high) focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--sdk-primary-color)';

export const FocusChip: FC<Props> = ({ count, currentIndex, reason, onPrev, onNext, onClear }) => {
    const label = reason ? truncate(reason, 60) : '';
    const showNav = count > 1;
    const position = showNav ? `${currentIndex + 1} / ${count}` : `${count}`;
    return (
        <div className="flex max-w-[320px] items-center gap-2 rounded-(--sdk-radius-10) border border-(--sdk-border-low) bg-(--sdk-surface-0) px-3 py-2 text-(--sdk-font-body-s) text-(--sdk-text-high) shadow-(--sdk-shadow-e2)">
            <span>
                <strong>Focus:</strong> {position} incident{count === 1 ? '' : 's'}
                {label ? <span className="text-(--sdk-text-medium)"> · {label}</span> : null}
            </span>
            {showNav && (
                <span className="ml-auto inline-flex items-center gap-0.5">
                    <button
                        type="button"
                        className={NAV_BTN_CLASS}
                        onClick={onPrev}
                        aria-label="Previous focused incident"
                    >
                        ‹
                    </button>
                    <button type="button" className={NAV_BTN_CLASS} onClick={onNext} aria-label="Next focused incident">
                        ›
                    </button>
                </span>
            )}
            <button
                type="button"
                className="cursor-pointer rounded-(--sdk-radius-5) border-0 bg-transparent p-0 text-[18px] leading-none text-(--sdk-text-medium) hover:text-(--sdk-text-high) focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--sdk-primary-color)"
                onClick={onClear}
                aria-label="Clear focus"
            >
                ×
            </button>
        </div>
    );
};
