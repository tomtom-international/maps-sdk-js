import type { ReactNode } from 'react';

// Single labelled row used by the entry-list panels to host the entry-mode toggle alongside the
// visibility legend. Kept tiny — just a flex row with the SDK's panel typography.
export function ModeRow({ children }: { children: ReactNode }) {
    return (
        <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-medium text-(--ui-text-med-em)">Display</span>
            {children}
        </div>
    );
}
