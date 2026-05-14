import { useRef, useState } from 'react';
import { AnalysisChart } from './AnalysisChart';

type ToolCallProps = {
    toolName: string;
    input: unknown;
    output?: unknown;
    errorText?: string;
};

function stringifyToolValue(value: unknown) {
    const serialized = typeof value === 'string' ? value : JSON.stringify(value, null, 2);
    return serialized || '-';
}

// Agent-toolkit `analyse*` tools return a Chart.js configuration alongside the structured
// analysis when invoked with `outputFormat: "chart"`. Surface it inline so the user sees a
// chart instead of a JSON blob; fall back to the raw output otherwise.
const CHART_PRODUCING_TOOLS = new Set(['analysePlaces', 'analyseRoutes', 'analyseIncidents']);
function extractChartConfig(toolName: string, output: unknown): unknown | null {
    if (!CHART_PRODUCING_TOOLS.has(toolName) || !output || typeof output !== 'object') return null;
    const o = output as { outputFormat?: unknown; analysis?: unknown };
    return o.outputFormat === 'chart' && o.analysis ? o.analysis : null;
}

export function ToolCall({ toolName, input, output, errorText }: ToolCallProps) {
    const [copyLabel, setCopyLabel] = useState('Copy');
    const preRef = useRef<HTMLPreElement>(null);

    const chartConfig = extractChartConfig(toolName, output);

    const contentText =
        output !== undefined
            ? `input\n${stringifyToolValue(input)}\n\noutput\n${stringifyToolValue(output)}`
            : errorText !== undefined
              ? `input\n${stringifyToolValue(input)}\n\nerror\n${errorText}`
              : `input\n${stringifyToolValue(input)}`;

    const handleCopy = (event: React.MouseEvent) => {
        event.stopPropagation();
        void navigator.clipboard.writeText(preRef.current?.textContent ?? '').then(() => {
            setCopyLabel('Copied!');
            setTimeout(() => setCopyLabel('Copy'), 1500);
        });
    };

    return (
        <>
            {chartConfig && (
                <div className="message assistant tool-chart">
                    <AnalysisChart config={chartConfig} />
                </div>
            )}
            <details className="tool-call max-w-[90%] self-start mx-3 my-1">
                <summary className="inline-flex h-5 w-fit cursor-pointer list-none items-center justify-center gap-1 rounded-[5px] bg-[rgba(0,0,0,0.04)] px-1 font-(family-name:--sdk-font-code) text-[12px] leading-5 font-semibold text-(--sdk-text-high) [&::-webkit-details-marker]:hidden">
                    <span>{toolName}</span>
                    <svg
                        className="shrink-0 transition-transform [details[open]_&]:rotate-90"
                        width="12"
                        height="12"
                        viewBox="0 0 12 12"
                        aria-hidden="true"
                    >
                        <path d="M4 3l4 3-4 3z" fill="currentColor" />
                    </svg>
                </summary>
                <div className="flex flex-col items-start gap-2 pt-2 text-(--sdk-text-medium)">
                    <button
                        type="button"
                        onClick={handleCopy}
                        className="cursor-pointer rounded-(--sdk-radius-5) border border-(--sdk-border-medium) bg-(--sdk-surface-1) px-1.5 py-0.5 font-(family-name:--sdk-font-code) text-[11px] leading-snug text-(--sdk-text-medium) transition-colors hover:bg-(--sdk-surface-2) hover:text-(--sdk-text-high)"
                    >
                        {copyLabel}
                    </button>
                    <pre
                        ref={preRef}
                        className="m-0 max-h-[300px] w-full overflow-y-auto font-(family-name:--sdk-font-code) text-[12px] whitespace-pre-wrap"
                    >
                        {contentText}
                    </pre>
                </div>
            </details>
        </>
    );
}
