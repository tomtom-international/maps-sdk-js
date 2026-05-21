import type { ClassificationResult } from '@tomtom-org/maps-sdk-plugin-agent-toolkit';

type ClassificationChipProps = {
    classification: ClassificationResult | null;
};

// Reads the classifier-emitted scope for `name`, if any, and formats it as `name(kind1, kind2)`.
// Scopable tools (`analyseData`, `processData`, …) carry a `{ kinds: string[] }` scope; non-scopable
// tools render as bare names. Unknown scope shapes fall back to the bare name silently — we
// don't want a malformed scope payload to break the chip rendering.
const formatPickedTool = (name: string, scopes: Record<string, unknown> | undefined): string => {
    const scope = scopes?.[name];
    if (!scope || typeof scope !== 'object') return name;
    const kinds = (scope as { kinds?: unknown }).kinds;
    if (!Array.isArray(kinds) || kinds.length === 0) return name;
    return `${name}(${kinds.join(', ')})`;
};

/**
 * Renders the most recent classifier result as a single subtle line — the pre-step tool selection
 * the LLM actually received on step 0. Designed to sit inline in the message stream just above
 * the turn's tool calls rather than as a banner at the top of the panel, so it reads as part of
 * the turn rather than as global chrome.
 *
 * Fail-open (`classification === null`) is the one case that still gets a warning treatment
 * because the cost implications of "every tool active" are worth surfacing distinctly.
 */
export function ClassificationChip({ classification }: ClassificationChipProps) {
    if (classification === null) {
        return (
            <div className="mx-3 mt-1 text-[11px] leading-snug text-(--sdk-color-error)">
                ⚠ classifier fail-open — ALL tools active
            </div>
        );
    }

    if (classification.activeToolNames.length === 0) {
        return null;
    }

    const pretty = classification.activeToolNames
        .map((name) => formatPickedTool(name, classification.toolScopes))
        .join(', ');

    return (
        <div className="mx-3 mt-1 truncate font-mono text-[11px] leading-snug text-(--sdk-text-low)">
            🎯 {pretty} · {Math.round(classification.timeMs)}ms
        </div>
    );
}
