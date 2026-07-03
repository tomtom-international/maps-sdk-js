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
        <div className="overflow-hidden rounded-(--pb-radius-5) border border-(--pb-border-low) bg-(--pb-surface-0)">
            <div className="flex items-center justify-between border-b border-(--pb-border-low) px-2 py-0.5 font-(family-name:--pb-font-code) text-[10px] font-semibold tracking-wide text-(--pb-text-low) uppercase">
                <span>code</span>
                <span className="text-(--pb-text-low)">JS</span>
            </div>
            <pre className="m-0 max-h-[320px] overflow-auto px-2 py-1.5 font-(family-name:--pb-font-code) text-[12px] leading-[1.5] whitespace-pre text-(--pb-text-high)">
                {prettifyJS(source)}
            </pre>
        </div>
    );
}

function JsonBlock({ value }: { value: unknown }) {
    return (
        <pre className="m-0 max-h-[260px] overflow-auto rounded-(--pb-radius-5) bg-(--pb-surface-0) px-2 py-1.5 font-(family-name:--pb-font-code) text-[12px] whitespace-pre-wrap">
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
        <pre className="m-0 max-h-[260px] overflow-auto rounded-(--pb-radius-5) border border-red-500/30 bg-red-500/10 px-2 py-1.5 font-(family-name:--pb-font-code) text-[12px] whitespace-pre-wrap text-red-700 dark:text-red-300">
            {pretty}
        </pre>
    );
}

function ToolCallSection({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <section className="flex w-full flex-col gap-1">
            <div className="font-(family-name:--pb-font-code) text-[11px] font-semibold tracking-wide text-(--pb-text-low) uppercase">
                {label}
            </div>
            {children}
        </section>
    );
}

// A single collapsible tool row: the toolName + a chevron, sitting inside the
// grouped "Used N tools" container (see ChatMessage's ToolGroup). Expanding it reveals the call's raw
// input/output/code so the debug data stays reachable; a per-tool copy icon (top-right, shown only when
// open) copies that payload.
export function ToolDisclosure({ toolName, input, output, errorText }: ToolCallProps) {
    const [copied, setCopied] = useState(false);
    const contentRef = useRef<HTMLDivElement>(null);

    const inputCode = takeCode(input);
    const inputJson = inputCode !== null ? stripCode(input) : input;
    const outputCode = output !== undefined ? takeCode(output) : null;
    const outputJson = outputCode !== null ? stripCode(output) : output;

    // The copy control lives inside <summary>, where a click would otherwise toggle the row — so
    // suppress that default (and bubbling) and just copy the expanded input/output text.
    const handleCopy = (event: React.MouseEvent) => {
        event.preventDefault();
        event.stopPropagation();
        navigator.clipboard
            .writeText(contentRef.current?.innerText ?? '')
            .then(() => {
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
            })
            .catch(() => setCopied(false));
    };

    return (
        <details className="group/tool tool-call w-full self-start">
            <summary className="flex w-full cursor-pointer list-none items-center gap-1 rounded-[5px] px-2 py-1 font-(family-name:--pb-font-code) text-[12px] leading-5 font-semibold text-(--pb-text-high) transition-colors hover:bg-[rgba(0,0,0,0.04)] [&::-webkit-details-marker]:hidden">
                <span className="min-w-0 truncate">{toolName}</span>
                <svg
                    className="shrink-0 transition-transform group-open/tool:rotate-90"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    aria-hidden="true"
                >
                    <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {/* Per-tool copy icon — only visible once the row is open. */}
                <button
                    type="button"
                    onClick={handleCopy}
                    aria-label={copied ? 'Copied' : 'Copy tool input and output'}
                    title={copied ? 'Copied' : 'Copy'}
                    className="ml-auto hidden h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded-(--pb-radius-5) border-0 bg-transparent text-(--pb-text-low) transition-colors group-open/tool:flex hover:bg-(--pb-surface-2) hover:text-(--pb-text-high) [&_svg]:h-4 [&_svg]:w-4"
                >
                    {copied ? (
                        <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                        >
                            <path d="M20 6 9 17l-5-5" />
                        </svg>
                    ) : (
                        <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                        >
                            <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                            <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                        </svg>
                    )}
                </button>
            </summary>
            <div
                ref={contentRef}
                className="flex w-full flex-col items-stretch gap-2 px-2 pt-1 pb-2 text-(--pb-text-medium)"
            >
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
    );
}

// Inline tool side-effect within the turn: the clarify intro line (its questions render as the pinned
// wizard — see MapAgentChat), read from the (streaming) args. All other tools render nothing here;
// their raw I/O lives in the "Used N tools" pill.
export function ToolCall({ toolName, input }: ToolCallProps) {
    const clarifyIntro =
        toolName === 'clarifyIntent' &&
        input &&
        typeof input === 'object' &&
        typeof (input as { intro?: unknown }).intro === 'string'
            ? (input as { intro: string }).intro
            : null;

    if (!clarifyIntro) return null;
    return (
        <p className="my-1 px-1 font-(family-name:--pb-font-secondary) text-[16px] leading-[24px] text-(--pb-text-medium)">
            {clarifyIntro}
        </p>
    );
}
