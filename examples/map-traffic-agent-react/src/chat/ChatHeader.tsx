import * as Tooltip from '@radix-ui/react-tooltip';
import { ArrowRight } from 'lucide-react';
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
        <div className="hidden max-sm:flex items-center justify-between gap-2 border-b border-(--ui-border-low-em) bg-[color-mix(in_srgb,var(--ui-surface-brand-red)_10%,var(--ui-surface-0))] px-3 py-2 text-[11px] text-(--ui-text-med-em)">
            <span className="min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap">
                Open the panel to chat with the agent toolkit — best experienced on desktop
            </span>
            <button
                aria-label="Dismiss"
                onClick={() => setDismissed(true)}
                className="shrink-0 cursor-pointer border-0 bg-transparent p-0.5 text-base leading-none text-(--ui-text-low-em) hover:opacity-100"
            >
                &times;
            </button>
        </div>
    );
}

const SIGN_UP_URL = 'https://docs.tomtom.com/maps-sdk-js/guides/plugins/agent-toolkit/overview';

function DemoBadge() {
    return (
        <Tooltip.Provider delayDuration={0}>
            <Tooltip.Root>
                <Tooltip.Trigger asChild>
                    <button
                        type="button"
                        className="flex h-6 shrink-0 cursor-pointer items-center gap-1 rounded-full border-0 bg-(--ui-surface-info-accent-1) pr-2.5 pl-1.5 font-(family-name:--ui-font-gilroy) text-[12px] leading-4 font-bold text-(--ui-text-info-on-base)"
                    >
                        <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor" aria-hidden="true">
                            <path d="M8.99999 2L3 9H6.99999V14L13 7H8.99999V2Z" />
                        </svg>
                        Demo
                    </button>
                </Tooltip.Trigger>
                <Tooltip.Portal>
                    <Tooltip.Content
                        className="ui-tooltip flex w-[216px] flex-col gap-3 rounded-xl! p-3! text-[14px]! leading-[18px]"
                        sideOffset={6}
                        collisionPadding={8}
                    >
                        This demo is made with TomTom’s Agent Toolkit Plugin. Create a free account to build your own.
                        <a
                            href={SIGN_UP_URL}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex h-8 items-center justify-center gap-2 rounded-full border border-(--ui-border-med-em) bg-(--ui-surface-0) font-bold text-(--ui-text-high-em) no-underline"
                        >
                            Get started
                            <ArrowRight size={14} strokeWidth={2.5} aria-hidden="true" />
                        </a>
                        <Tooltip.Arrow className="ui-tooltip-arrow" width={12} height={6} />
                    </Tooltip.Content>
                </Tooltip.Portal>
            </Tooltip.Root>
        </Tooltip.Provider>
    );
}

export function ChatHeader({ isCollapsed, onToggle, label = 'Maps agent' }: ChatHeaderProps) {
    return (
        <>
            <MobileNudge isCollapsed={isCollapsed} />
            <div className="box-border flex h-[52px] shrink-0 flex-row items-center gap-1.5 rounded-[40px] bg-(--ui-surface-0) py-1 pr-3 pl-4 shadow-(--ui-elevation-e3)">
                <span role="img" aria-label="TomTom" className="mr-1.5 flex shrink-0 [&_svg]:block">
                    <Icon raw={tomtomLogoRaw} />
                </span>
                <span className="h-[21px] w-[0.75px] shrink-0 bg-(--ui-border-low-em)" aria-hidden="true" />
                <span className="ml-1.5 min-w-0 flex-1 truncate font-(family-name:--ui-font-gilroy) text-[14px] leading-5 font-bold text-(--ui-text-high-em)">
                    {label}
                </span>
                <DemoBadge />
                <button
                    onClick={onToggle}
                    aria-label={isCollapsed ? 'Expand chat' : 'Collapse chat'}
                    className="hidden h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full border border-(--ui-border-med-em) bg-transparent text-(--ui-text-med-em) transition-transform max-sm:flex"
                >
                    <span className={`flex transition-transform ${isCollapsed ? 'rotate-180' : ''}`}>
                        <Icon raw={chevronDownIconRaw} />
                    </span>
                </button>
            </div>
        </>
    );
}
