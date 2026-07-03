import { useState } from 'react';
import chevronDownIconRaw from './assets/chevron-down.svg?raw';
import tomtomLogoRaw from './assets/tomtom-logo.svg?raw';
import { Icon } from './icon';

type ChatHeaderProps = {
    isCollapsed: boolean;
    onToggle: () => void;
    /** Label shown next to the TomTom logo. Defaults to "Maps agent". */
    label?: string;
};

function MobileNudge({ isCollapsed }: { isCollapsed: boolean }) {
    const [dismissed, setDismissed] = useState(false);
    // Once the user opens the panel the prompt to "open the panel" is moot.
    if (dismissed || !isCollapsed) return null;
    return (
        <div className="hidden max-sm:flex items-center justify-between gap-2 border-b border-(--pb-border-low) bg-[color-mix(in_srgb,var(--pb-primary-color)_10%,var(--pb-surface-0))] px-3 py-2 text-[11px] text-(--pb-text-medium)">
            <span className="min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap">
                Open the panel to chat with the agent toolkit — best experienced on desktop
            </span>
            <button
                aria-label="Dismiss"
                onClick={() => setDismissed(true)}
                className="shrink-0 cursor-pointer border-0 bg-transparent p-0.5 text-base leading-none text-(--pb-text-low) hover:opacity-100"
            >
                &times;
            </button>
        </div>
    );
}

export function ChatHeader({ isCollapsed, onToggle, label = 'Maps agent' }: ChatHeaderProps) {
    return (
        <>
            <MobileNudge isCollapsed={isCollapsed} />
            <div className="box-border flex h-[52px] shrink-0 flex-row items-center gap-1.5 rounded-[40px] bg-(--pb-surface-0) py-1 pr-1 pl-4 shadow-(--pb-shadow-e3)">
                <span
                    className="flex shrink-0 items-center [&_svg]:block [&_svg]:h-6 [&_svg]:w-[94px]"
                    aria-label="TomTom"
                >
                    <Icon raw={tomtomLogoRaw} />
                </span>
                <span className="h-[21px] w-[0.75px] shrink-0 bg-(--pb-border-low)" aria-hidden="true" />
                <span className="ml-[9px] flex-1 font-(family-name:--pb-font-primary) text-[16px] leading-[15px] font-bold text-(--pb-text-high)">
                    {label}
                </span>
                <button
                    onClick={onToggle}
                    aria-label={isCollapsed ? 'Expand chat' : 'Collapse chat'}
                    className="hidden h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full border border-(--pb-border-medium) bg-transparent text-(--pb-text-medium) transition-transform max-sm:flex"
                >
                    <span className={`flex transition-transform ${isCollapsed ? 'rotate-180' : ''}`}>
                        <Icon raw={chevronDownIconRaw} />
                    </span>
                </button>
            </div>
        </>
    );
}
