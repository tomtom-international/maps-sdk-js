import { useRef, useState } from 'react';

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

// Pull a `code: string` property out of a tool's input so it can be promoted to its own labelled
// section and rendered as a real whitespace-preserving code block instead of getting JSON-escaped
// into a single \n-stuffed line. Hits sandbox tools (analyseData / processData / executeMaplibreCode).
function takeCode(value: unknown): string | null {
    if (value && typeof value === 'object' && typeof (value as Record<string, unknown>).code === 'string') {
        return (value as Record<string, string>).code;
    }
    return null;
}
function stripCode(value: unknown): unknown {
    if (!value || typeof value !== 'object') return undefined;
    const { code: _omit, ...rest } = value as Record<string, unknown>;
    return Object.keys(rest).length > 0 ? rest : undefined;
}

// Tiny JS pretty-printer. Only kicks in when the LLM emits one-line code; multi-line input is
// trusted as-is. String / template / comment runs are copied verbatim so we don't mangle their
// content. Good enough for the typical analyseData / processData sandbox snippet — not a parser.
// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: JS pretty-printer requires multi-branch character-by-character state machine
function prettifyJS(code: string): string {
    if (code.includes('\n')) return code;
    let out = '';
    let indent = 0;
    const writeIndent = () => {
        out += '    '.repeat(indent);
    };
    const trimTrailing = () => {
        out = out.replace(/[ \t]+$/, '');
    };
    let i = 0;
    while (i < code.length) {
        const ch = code.charAt(i);
        if (ch === '"' || ch === "'" || ch === '`') {
            const quote = ch;
            out += ch;
            i++;
            while (i < code.length) {
                const c = code.charAt(i);
                out += c;
                i++;
                if (c === '\\' && i < code.length) {
                    out += code.charAt(i);
                    i++;
                    continue;
                }
                if (c === quote) break;
            }
            continue;
        }
        if (ch === '/' && code[i + 1] === '/') {
            while (i < code.length && code[i] !== '\n') out += code[i++];
            continue;
        }
        if (ch === '/' && code[i + 1] === '*') {
            out += '/*';
            i += 2;
            while (i < code.length && !(code[i] === '*' && code[i + 1] === '/')) out += code[i++];
            out += '*/';
            i += 2;
            continue;
        }
        if (ch === '{') {
            indent++;
            out += '{\n';
            writeIndent();
        } else if (ch === '}') {
            indent = Math.max(0, indent - 1);
            trimTrailing();
            if (!out.endsWith('\n')) out += '\n';
            writeIndent();
            out += '}';
        } else if (ch === ';') {
            out += ';\n';
            writeIndent();
        } else if (ch === ' ' || ch === '\t') {
            if (out.length > 0 && !/\s$/.test(out)) out += ' ';
        } else {
            out += ch;
        }
        i++;
    }
    return out
        .split('\n')
        .map((l) => l.replace(/[ \t]+$/, ''))
        .join('\n')
        .trim();
}

function CodeBlock({ source }: { source: string }) {
    return (
        <div className="overflow-hidden rounded-(--sdk-radius-5) border border-(--sdk-border-low) bg-(--sdk-surface-2)">
            <div className="flex items-center justify-between border-b border-(--sdk-border-low) px-2 py-0.5 font-(family-name:--sdk-font-code) text-[10px] font-semibold tracking-wide text-(--sdk-text-low) uppercase">
                <span>code</span>
                <span className="text-(--sdk-text-low)">JS</span>
            </div>
            <pre className="m-0 max-h-[320px] overflow-auto px-2 py-1.5 font-(family-name:--sdk-font-code) text-[12px] leading-[1.5] whitespace-pre text-(--sdk-text-high)">
                {prettifyJS(source)}
            </pre>
        </div>
    );
}

function JsonBlock({ value }: { value: unknown }) {
    return (
        <pre className="m-0 max-h-[260px] overflow-auto rounded-(--sdk-radius-5) bg-(--sdk-surface-1) px-2 py-1.5 font-(family-name:--sdk-font-code) text-[12px] whitespace-pre-wrap">
            {stringifyToolValue(value)}
        </pre>
    );
}

// Tinted variant for error payloads. If the text is JSON-shaped (the agent-toolkit `toolErrorSchema`
// detour, or a Zod issue array, can arrive as a single-line string), re-parse + re-stringify so the
// reader sees indented multi-line structure instead of one wall of escapes.
function ErrorBlock({ text }: { text: string }) {
    const trimmed = text.trim();
    let pretty = text;
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
        try {
            pretty = JSON.stringify(JSON.parse(trimmed), null, 2);
        } catch {
            /* not JSON; keep as-is */
        }
    }
    return (
        <pre className="m-0 max-h-[260px] overflow-auto rounded-(--sdk-radius-5) border border-red-500/30 bg-red-500/10 px-2 py-1.5 font-(family-name:--sdk-font-code) text-[12px] whitespace-pre-wrap text-red-700 dark:text-red-300">
            {pretty}
        </pre>
    );
}

function ToolCallSection({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <section className="flex w-full flex-col gap-1">
            <div className="font-(family-name:--sdk-font-code) text-[11px] font-semibold tracking-wide text-(--sdk-text-low) uppercase">
                {label}
            </div>
            {children}
        </section>
    );
}

export function ToolCall({ toolName, input, output, errorText }: ToolCallProps) {
    const [copyLabel, setCopyLabel] = useState('Copy');
    const contentRef = useRef<HTMLDivElement>(null);

    // Charts are NOT rendered inline in the chat for this demo — analysis charts live in the
    // right-rail Analyses panel instead. (See ui/AnalysesPanel.)

    const inputCode = takeCode(input);
    const inputJson = inputCode !== null ? stripCode(input) : input;
    const outputCode = output !== undefined ? takeCode(output) : null;
    const outputJson = outputCode !== null ? stripCode(output) : output;

    const handleCopy = (event: React.MouseEvent) => {
        event.stopPropagation();
        void navigator.clipboard.writeText(contentRef.current?.innerText ?? '').then(() => {
            setCopyLabel('Copied!');
            setTimeout(() => setCopyLabel('Copy'), 1500);
        });
    };

    return (
        <>
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
                <div
                    ref={contentRef}
                    className="flex w-full flex-col items-stretch gap-2 pt-2 text-(--sdk-text-medium)"
                >
                    <button
                        type="button"
                        onClick={handleCopy}
                        className="w-fit cursor-pointer rounded-(--sdk-radius-5) border border-(--sdk-border-medium) bg-(--sdk-surface-1) px-1.5 py-0.5 font-(family-name:--sdk-font-code) text-[11px] leading-snug text-(--sdk-text-medium) transition-colors hover:bg-(--sdk-surface-2) hover:text-(--sdk-text-high)"
                    >
                        {copyLabel}
                    </button>
                    {inputCode !== null && <CodeBlock source={inputCode} />}
                    {inputJson !== undefined && (
                        <ToolCallSection label="input">
                            <JsonBlock value={inputJson} />
                        </ToolCallSection>
                    )}
                    {output !== undefined && (
                        <>
                            {outputCode !== null && <CodeBlock source={outputCode} />}
                            {outputJson !== undefined && (
                                <ToolCallSection label="output">
                                    <JsonBlock value={outputJson} />
                                </ToolCallSection>
                            )}
                        </>
                    )}
                    {output === undefined && errorText !== undefined && (
                        <ToolCallSection label="error">
                            <ErrorBlock text={errorText} />
                        </ToolCallSection>
                    )}
                </div>
            </details>
        </>
    );
}
