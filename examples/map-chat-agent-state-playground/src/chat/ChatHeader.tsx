import { useState } from 'react';
import chevronDownIconRaw from './assets/chevron-down.svg?raw';
import tomtomLogoRaw from './assets/tomtom-logo.svg?raw';
import { Icon } from './icon';

type ChatHeaderProps = {
    isCollapsed: boolean;
    onToggle: () => void;
    /** Label shown next to the TomTom logo. Defaults to "Maps agent". */
    label?: string;
    /** Optional deployment selector — renders as a badge (single) or `<select>` (multiple). */
    deploymentId?: string;
    availableDeployments?: readonly string[];
    onDeploymentChange?: (deploymentId: string) => void;
    /** Optional running session token totals. When provided and non-zero, a compact
     * `In … · Out …` chip is rendered next to the title. */
    tokenUsage?: { input: number; output: number };
};

function TokenUsageBadge({ input, output }: { input: number; output: number }) {
    if (input === 0 && output === 0) return null;
    return (
        <span
            className="flex items-center gap-1.5 rounded-full bg-(--ui-surface-1) px-2 py-0.5 text-[11px] text-(--ui-text-med-em) tabular-nums"
            title="LLM tokens used this session"
            aria-label={`Tokens used: ${input.toLocaleString()} in, ${output.toLocaleString()} out`}
        >
            <span>
                In <strong className="font-semibold text-(--ui-surface-brand-red)">{input.toLocaleString()}</strong>
            </span>
            <span aria-hidden="true" className="text-(--ui-text-low-em)">
                ·
            </span>
            <span>
                Out <strong className="font-semibold text-(--ui-surface-brand-red)">{output.toLocaleString()}</strong>
            </span>
        </span>
    );
}

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

function ModelBadge({
    deploymentId,
    availableDeployments,
    onDeploymentChange,
}: {
    deploymentId: string;
    availableDeployments: readonly string[];
    onDeploymentChange?: (deploymentId: string) => void;
}) {
    const badgeClass = 'rounded-full bg-(--ui-surface-1) px-2 py-0.5 text-[11px] text-(--ui-text-med-em)';
    if (availableDeployments.length <= 1 || !onDeploymentChange) {
        return <span className={badgeClass}>{deploymentId}</span>;
    }
    return (
        <select
            className={`${badgeClass} cursor-pointer border-0 outline-none`}
            value={deploymentId}
            onChange={(e) => onDeploymentChange(e.target.value)}
            aria-label="Model"
        >
            {availableDeployments.map((id) => (
                <option key={id} value={id}>
                    {id}
                </option>
            ))}
        </select>
    );
}

export function ChatHeader({
    isCollapsed,
    onToggle,
    label = 'Maps agent',
    deploymentId,
    availableDeployments,
    onDeploymentChange,
    tokenUsage,
}: ChatHeaderProps) {
    return (
        <>
            <MobileNudge isCollapsed={isCollapsed} />
            <div className="box-border flex h-[52px] shrink-0 flex-row items-center gap-1.5 rounded-[40px] bg-(--ui-surface-0) py-1 pr-1 pl-4 shadow-(--ui-elevation-e3)">
                <span
                    className="flex shrink-0 items-center [&_svg]:block [&_svg]:h-6 [&_svg]:w-[94px]"
                    aria-label="TomTom"
                >
                    <Icon raw={tomtomLogoRaw} />
                </span>
                <span className="h-[21px] w-[0.75px] shrink-0 bg-(--ui-border-low-em)" aria-hidden="true" />
                <span className="ml-[9px] flex-1 font-(family-name:--ui-font-gilroy) text-[16px] leading-[15px] font-bold text-(--ui-text-high-em)">
                    {label}
                </span>
                {tokenUsage && <TokenUsageBadge input={tokenUsage.input} output={tokenUsage.output} />}
                {deploymentId && availableDeployments && (
                    <ModelBadge
                        deploymentId={deploymentId}
                        availableDeployments={availableDeployments}
                        onDeploymentChange={onDeploymentChange}
                    />
                )}
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
