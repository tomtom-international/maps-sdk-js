import type { FC } from 'react';
import { cardShellClass, IconButton } from './components';

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
        <div
            className={`flex max-w-[320px] items-center gap-2 px-3 py-2 text-(--pb-font-body-s) text-(--pb-text-high) ${cardShellClass}`}
        >
            <span>
                <strong>Focus:</strong> {position} incident{count === 1 ? '' : 's'}
                {label ? <span className="text-(--pb-text-medium)"> · {label}</span> : null}
            </span>
            {showNav && (
                <span className="ml-auto inline-flex items-center gap-0.5">
                    <IconButton
                        label="Previous focused incident"
                        onClick={onPrev}
                        size="sm"
                        variant="outline"
                        className="text-[16px]"
                    >
                        ‹
                    </IconButton>
                    <IconButton
                        label="Next focused incident"
                        onClick={onNext}
                        size="sm"
                        variant="outline"
                        className="text-[16px]"
                    >
                        ›
                    </IconButton>
                </span>
            )}
            <IconButton
                label="Clear focus"
                onClick={onClear}
                size="sm"
                className={`text-[18px] ${showNav ? '' : 'ml-auto'}`}
            >
                ×
            </IconButton>
        </div>
    );
};
