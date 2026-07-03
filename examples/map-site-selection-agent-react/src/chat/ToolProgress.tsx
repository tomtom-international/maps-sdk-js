import { useToolProgress } from '../progress/progress-store';

// Live checklist of a tool's internal steps (driven by the tool itself, not the agent). Renders
// nothing for tools that never logged progress, so it self-gates to our analysis tools.
//
// Figma "Reasoning" block: a white hairline-bordered card with bold Proxima labels. done = filled
// black circle + white tick; active = spinning green ring; pending = small grey dot.
function StepIcon({ done, active }: { done: boolean; active: boolean }) {
    if (done) {
        return (
            <span className="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full bg-(--pb-text-high)">
                <svg
                    viewBox="0 0 24 24"
                    width="11"
                    height="11"
                    fill="none"
                    stroke="#fff"
                    strokeWidth="3.5"
                    aria-hidden="true"
                >
                    <path d="M5 12l5 5L19 7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            </span>
        );
    }
    if (active) {
        return (
            <span
                aria-hidden="true"
                className="h-[18px] w-[18px] shrink-0 animate-spin rounded-full border-2 border-[#1F9D55] border-t-transparent"
            />
        );
    }
    return (
        <span className="flex h-[18px] w-[18px] shrink-0 items-center justify-center" aria-hidden="true">
            <span className="h-1.5 w-1.5 rounded-full bg-(--pb-border-medium)" />
        </span>
    );
}

export function ToolProgress({ toolName }: { toolName: string }) {
    const run = useToolProgress(toolName);
    if (!run) return null;

    return (
        <div className="my-1 flex w-full flex-col gap-2 self-start rounded-(--pb-radius-10) border border-(--pb-border-low) bg-(--pb-surface-0) p-3">
            {run.steps.map((label, index) => {
                const done = run.done || index < run.currentStep;
                const active = !run.done && index === run.currentStep;
                return (
                    <div
                        key={label}
                        className="flex items-center gap-2 font-(family-name:--pb-font-secondary) text-[14px] leading-[20px] font-semibold"
                        style={{ color: done || active ? 'var(--pb-text-high)' : 'var(--pb-text-low)' }}
                    >
                        <StepIcon done={done} active={active} />
                        <span>{label}</span>
                    </div>
                );
            })}
        </div>
    );
}
