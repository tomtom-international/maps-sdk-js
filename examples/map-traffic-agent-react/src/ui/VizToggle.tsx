import { useEffect, useRef, useState } from 'react';
import type { VizMode } from '../viz/types';

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
        <div className="viz-toggle" ref={rootRef}>
            <label className="sdk-example-toggle-label viz-toggle__switch" title="Toggle delay-density heatmap">
                <input
                    type="checkbox"
                    className="sdk-example-toggle-input"
                    checked={on}
                    onChange={(e) => onChange(e.target.checked ? 'heatmap' : 'off')}
                />
                <span className="sdk-example-toggle-switch" aria-hidden="true" />
                Heatmap
            </label>
            <button
                type="button"
                className="viz-toggle__info"
                aria-label="About the heatmap"
                aria-expanded={infoOpen}
                onClick={() => setInfoOpen((v) => !v)}
            >
                i
            </button>
            {infoOpen && (
                <div className="viz-toggle__popover" role="dialog" aria-label="About the heatmap">
                    <p>
                        <strong>Red = where delay is concentrated</strong>, not total network impact. A short hard
                        closure burns redder than a long slow queue with the same total seconds lost.
                    </p>
                    <p className="viz-toggle__popover-note">
                        Use the KPI strip and triage panel for total impact across the network.
                    </p>
                </div>
            )}
        </div>
    );
}
