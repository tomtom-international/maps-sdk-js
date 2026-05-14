import { useEffect, useRef, useState } from 'react';
import type { VizMode } from '../viz/types';
import { Toggle } from './components';

export type VizToggleProps = {
    mode: VizMode;
    onChange: (mode: VizMode) => void;
};

export function VizToggle({ mode, onChange }: VizToggleProps) {
    const on = mode === 'heatmap';
    const [infoOpen, setInfoOpen] = useState(false);
    const rootRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (!infoOpen) return;
        const onDocPointer = (e: PointerEvent) => {
            if (!rootRef.current?.contains(e.target as Node)) setInfoOpen(false);
        };
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setInfoOpen(false);
        };
        document.addEventListener('pointerdown', onDocPointer);
        document.addEventListener('keydown', onKey);
        return () => {
            document.removeEventListener('pointerdown', onDocPointer);
            document.removeEventListener('keydown', onKey);
        };
    }, [infoOpen]);

    return (
        <div
            ref={rootRef}
            className="relative flex items-center gap-2 rounded-(--sdk-radius-10) border border-(--sdk-border-low) bg-(--sdk-surface-0) px-3 py-2 text-(--sdk-font-caption-m) shadow-(--sdk-shadow-e4) backdrop-blur-md"
        >
            <Toggle
                checked={on}
                onChange={(checked) => onChange(checked ? 'heatmap' : 'off')}
                label="Heatmap"
                title="Toggle delay-density heatmap"
                size="sm"
                tone="primary"
            />
            <button
                type="button"
                className="inline-flex h-[18px] w-[18px] cursor-pointer items-center justify-center rounded-full border border-(--sdk-border-low) bg-(--sdk-surface-1) p-0 font-(family-name:--sdk-font-primary) text-[11px] font-semibold italic leading-none text-(--sdk-text-medium) hover:bg-(--sdk-surface-2) hover:text-(--sdk-text-high) aria-expanded:bg-(--sdk-surface-2) aria-expanded:text-(--sdk-text-high)"
                aria-label="About the heatmap"
                aria-expanded={infoOpen}
                onClick={() => setInfoOpen((v) => !v)}
            >
                i
            </button>
            {infoOpen && (
                <div
                    role="dialog"
                    aria-label="About the heatmap"
                    className="absolute left-0 top-[calc(100%+var(--sdk-space-2))] z-10 w-max max-w-[280px] rounded-(--sdk-radius-10) border border-(--sdk-border-low) bg-(--sdk-surface-0) p-3 text-(--sdk-font-caption-m) leading-[1.4] text-(--sdk-text-high) shadow-(--sdk-shadow-e4) backdrop-blur-md [&>p]:m-0 [&>p+p]:mt-2"
                >
                    <p>
                        <strong>Red = where delay is concentrated</strong>, not total network impact. A short hard
                        closure burns redder than a long slow queue with the same total seconds lost.
                    </p>
                    <p className="text-(--sdk-text-medium)">
                        Use the KPI strip and triage panel for total impact across the network.
                    </p>
                </div>
            )}
        </div>
    );
}
