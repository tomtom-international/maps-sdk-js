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

const CHART_PRODUCING_TOOLS = new Set(['analyseIncidents']);
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
                <div className="message tool-chart">
                    <AnalysisChart config={chartConfig} />
                </div>
            )}
            <details className="tool-call">
                <summary className="tool-call-tag">
                    <span className="tool-call-name">{toolName}</span>
                    <svg className="tool-call-chevron" width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
                        <path d="M4 3l4 3-4 3z" fill="currentColor" />
                    </svg>
                </summary>
                <div className="tool-content">
                    <button type="button" className="tool-copy-button" onClick={handleCopy}>
                        {copyLabel}
                    </button>
                    <pre ref={preRef} className="tool-content-text">
                        {contentText}
                    </pre>
                </div>
            </details>
        </>
    );
}
