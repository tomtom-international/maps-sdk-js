/**
 * @module agent-toolkit-system-prompt
 *
 * Behavioral contract: persona, tone, dual-response, cadence — lives here.
 *
 * Tool mechanics: call shape, return shape, error handling, when-to-use vs.
 * which-tool-next — lives in the relevant tool's description string and Zod
 * schema. Each tool re-explains its own role; the LLM sees those alongside
 * this prompt. The intent classifier (see `utils/intent-classifier.ts`) also
 * scopes tools per step, so a tool's description is only in context when that
 * tool is active — keep cross-cutting safety rules here (always present), and
 * leave per-tool mechanics to the tool itself.
 *
 * If you find yourself adding lines here to fix an LLM mistake, ask first
 * whether the fix belongs in a tool description or a tool error message.
 *
 * The prompt is split into named {@link SYSTEM_PROMPT_SECTIONS} so consumers can
 * override a single section via {@link composeSystemPrompt} without rebuilding
 * the whole string.
 */

/**
 * Named, individually-overridable sections of the base system prompt.
 *
 * @group Agent Toolkit
 */
export type SystemPromptSection =
    | 'identity'
    | 'capabilities'
    | 'rejectionRules'
    | 'responseFormatting'
    | 'dataConfidence'
    | 'toolExecution'
    | 'sessionState';

/**
 * Per-section body overrides. Each key replaces that section's body; omitted
 * sections fall back to {@link SYSTEM_PROMPT_SECTIONS}. Accepted by
 * {@link composeSystemPrompt} and `MapAgentOptions.systemPrompt`.
 *
 * @remarks
 * To *extend* rather than replace a section, read its current default from the
 * exported {@link SYSTEM_PROMPT_SECTIONS} map and override with a derived string
 * — e.g. append a rule, prepend a note, or hand the default to a coding agent to
 * rewrite under some criteria:
 *
 * ```typescript
 * composeSystemPrompt({
 *   // Keep the default behaviour, add one extra line.
 *   responseFormatting: `${SYSTEM_PROMPT_SECTIONS.responseFormatting}\n- Always answer in Spanish.`,
 * });
 * ```
 *
 * @group Agent Toolkit
 */
export type SystemPromptSectionOverrides = Partial<Record<SystemPromptSection, string>>;

// Headings the composer prepends to each section's body. Kept separate from the
// body text so a consumer overriding a section supplies only the body — the
// `RESPONSE FORMATTING:` / `SESSION STATE:` heading is added automatically. The
// opening prose sections (identity / capabilities) carry no heading; they read as
// the prompt's natural-language preamble.
const SECTION_HEADINGS: Record<SystemPromptSection, string | null> = {
    identity: null,
    capabilities: null,
    rejectionRules: 'SCOPE & REJECTIONS',
    responseFormatting: 'RESPONSE FORMATTING',
    dataConfidence: 'DATA CONFIDENCE',
    toolExecution: 'TOOL EXECUTION',
    sessionState: 'SESSION STATE',
};

/**
 * The default body text for each base-prompt section — heading excluded.
 *
 * @remarks
 * Each value is the section's content only; the structural heading (e.g.
 * `RESPONSE FORMATTING:`) is added by {@link composeSystemPrompt}. So an override
 * passes just the body — `composeSystemPrompt({ responseFormatting: 'Reply in Spanish.' })`
 * still renders under the `RESPONSE FORMATTING:` heading.
 *
 * The behavioral prose is split so each concern is overridable on its own:
 * - `identity` — who the assistant is and its tone of voice; the natural hook to
 *   rebrand or set a persona.
 * - `capabilities` — the map environment plus a compact summary of what the
 *   toolkit can do. Kept at the group level (not per-tool) so it does not drift
 *   as tools change; the exact mechanics live in each tool's description and the
 *   classifier prompt. It also gives `rejectionRules` something concrete to steer
 *   the user back toward.
 * - `rejectionRules` — how to handle in-scope / mixed / out-of-scope / illegal
 *   requests, and the requirement to always explain a rejection.
 * - `dataConfidence` — how to surface incomplete, partial, stale, or conflicting
 *   data instead of presenting it as complete.
 *
 * Location-reference routing ("near me" → getCurrentLocation, "here" →
 * getViewport) is intentionally NOT a section: it is a tool-selection rule
 * already owned by the classifier prompt and the two tools' cross-referencing
 * descriptions.
 *
 * This map is the canonical source of the default body text, exported so a
 * consumer can read a default and override with a derived value (extend, prefix,
 * or rewrite it) — see {@link SystemPromptSectionOverrides}.
 *
 * @group Agent Toolkit
 */
export const SYSTEM_PROMPT_SECTIONS: Record<SystemPromptSection, string> = {
    identity: 'You are a helpful map assistant.',
    capabilities:
        'You operate a TomTom interactive map with location services. You can search places, POIs, and addresses ' +
        '(and reverse-geocode); plan and edit multi-stop routes (alternatives, cost models); compute reachable-area ' +
        '(isochrone) ranges; load live traffic incidents and historical traffic analytics, then cluster, monitor, or ' +
        'focus them; run spatial analysis, aggregations, and charts over loaded data and derive geometries; add your ' +
        'own GeoJSON layers; and control the map — pan, zoom, pitch/bearing, styles, base-map tiles, and show/hide results.',
    rejectionRules:
        "- Handle the in-scope part fully, then note what you can't help with.\n" +
        "- Fully out of scope: decline and describe what you cover — don't guess the user's need.\n" +
        '- Flag scope creep as it arises, not at the end.\n' +
        '- Reject illegal requests outright with a brief reason and no detail — no partial help, rephrasing, or redirecting.\n' +
        '- Every rejection states why and offers an in-scope next step — never a dead end.',
    responseFormatting:
        '- Use markdown; bold key info; bullet lists for multiple items.\n' +
        '- Be concise — lead with the most relevant information.',
    dataConfidence:
        "- Return incomplete, outdated, or low-coverage data with a clear note on what's limited and why — never present it as complete.\n" +
        "- If only partial, name what's missing and offer to proceed — let the user decide.\n" +
        '- If signals conflict, acknowledge it, state what you used, and why.',
    toolExecution:
        '- Call context-independent tools in the same step (parallel execution).\n' +
        `- Use a tool's own show / showOnMap to render results in the same step, rather than a separate follow-up display call.`,
    sessionState: `- Results are stored as stable, append-only entries (e.g. \`places-3\`, \`routes-1\`) that every show / recall / process / analyse tool accepts. Call recallState to see what's loaded; always check it before referencing an entry id — never invent ids.`,
};

// Canonical assembly order. Sections are joined with a blank line between them.
const SECTION_ORDER: SystemPromptSection[] = [
    'identity',
    'capabilities',
    'rejectionRules',
    'responseFormatting',
    'dataConfidence',
    'toolExecution',
    'sessionState',
];

// Prepend the section heading (if any) to its body.
const renderSection = (key: SystemPromptSection, body: string): string => {
    const heading = SECTION_HEADINGS[key];
    return heading ? `${heading}:\n${body}` : body;
};

/**
 * Composes the base system prompt from {@link SYSTEM_PROMPT_SECTIONS}, applying
 * any per-section overrides.
 *
 * @param overrides - Replacement **body** text keyed by section; omitted
 * sections fall back to the default. The section heading is added automatically,
 * so an override does not repeat it. Pass the result to
 * `MapAgentOptions.systemPrompt`.
 * @returns The composed system prompt string.
 *
 * @example
 * ```typescript
 * import { createMapAgent, composeSystemPrompt } from '@tomtom-org/maps-sdk-plugin-agent-toolkit';
 *
 * const agent = createMapAgent(map, {
 *   model: openai('gpt-4o'),
 *   // No need to repeat "RESPONSE FORMATTING:" — it is prepended for you.
 *   systemPrompt: composeSystemPrompt({
 *     responseFormatting: 'Always respond in Spanish, and keep it terse.',
 *   }),
 * });
 * ```
 *
 * @group Agent Toolkit
 */
export const composeSystemPrompt = (overrides?: SystemPromptSectionOverrides): string =>
    SECTION_ORDER.map((key) => renderSection(key, overrides?.[key] ?? SYSTEM_PROMPT_SECTIONS[key])).join('\n\n');

/**
 * The base system prompt that teaches the LLM how to use the agent toolkit tools.
 *
 * @remarks
 * Equivalent to `composeSystemPrompt()` with no overrides. Export this constant
 * so consumers can reference or extend it when providing a custom system prompt
 * via `MapAgentOptions.systemPrompt`. To replace just one section, prefer
 * {@link composeSystemPrompt} instead of rebuilding the whole string.
 *
 * @example
 * ```typescript
 * import { createMapAgent, BASE_SYSTEM_PROMPT } from '@tomtom-org/maps-sdk-plugin-agent-toolkit';
 *
 * const agent = createMapAgent(map, {
 *   model: openai('gpt-4o'),
 *   systemPrompt: BASE_SYSTEM_PROMPT + '\n\nAlways respond in Spanish.'
 * });
 * ```
 *
 * @group Agent Toolkit
 */
export const BASE_SYSTEM_PROMPT = composeSystemPrompt();

/**
 * Inputs to {@link buildSystemPrompt}.
 *
 * @internal
 * @ignore
 */
export type BuildSystemPromptOptions = {
    /**
     * Either a full prompt string that replaces the base entirely, or
     * {@link SystemPromptSectionOverrides} composed onto the base. A full string
     * ignores `prefix` and `suffix` (the caller owns the whole prompt); section
     * overrides (or none) still honor both.
     */
    customPrompt?: string | SystemPromptSectionOverrides;
    /**
     * Preamble prepended above the whole prompt, separated by a blank line and
     * carrying no heading. Ignored when `customPrompt` is a full string.
     */
    prefix?: string;
    /**
     * Additional prompt text appended under an `ADDITIONAL INSTRUCTIONS` heading.
     * Ignored when `customPrompt` is a full string.
     */
    suffix?: string;
};

/**
 * Builds the complete system prompt for the agent toolkit.
 *
 * @param options - See {@link BuildSystemPromptOptions}.
 * @returns Complete system prompt string
 *
 * @internal
 * @ignore
 */
export const buildSystemPrompt = ({ customPrompt, prefix, suffix }: BuildSystemPromptOptions = {}): string => {
    // A full string replacement wins outright — the caller owns the whole prompt, so prefix/suffix are ignored.
    if (typeof customPrompt === 'string') {
        return customPrompt;
    }
    // Section overrides (or none) compose onto the base; an optional prefix prepends and suffix appends.
    const base = customPrompt ? composeSystemPrompt(customPrompt) : BASE_SYSTEM_PROMPT;
    const withSuffix = suffix ? `${base}\n\nADDITIONAL INSTRUCTIONS:\n${suffix}` : base;
    return prefix ? `${prefix}\n\n${withSuffix}` : withSuffix;
};
