/**
 * @module agent-toolkit-tools
 */

import { z } from 'zod';
import type { ToolEntry, ToolState } from '../../types';

// clarifyIntent is a UI-only tool: it doesn't fetch or compute anything. It renders the agent's
// questions as a quick multiple-choice form in the chat. The user's picks are sent back as their
// next message, which the agent then acts on. Use it instead of a prose question when a few
// discrete choices would unblock the task. Anything `question*` is shown to the USER; the "stop and
// wait" directive lives in the description-level usage contract, not the result.

/** A single clarification question shown to the user. Exported so a host can type its form state. */
export const questionSchema = z.object({
    id: z.string().describe('Short stable key for the answer, e.g. "travelMode" or "radius".'),
    question: z.string().describe('The question to put to the user.'),
    options: z
        .array(z.string())
        .min(2)
        .max(8)
        .describe(
            'Concrete suggestions, shown as numbered rows the user taps to answer. A freeform "Something else" ' +
                'input is always shown too, so do NOT add your own "other"/"something else" option — just offer your ' +
                'best concrete suggestions.',
        ),
    multiSelect: z
        .boolean()
        .default(false)
        .describe(
            'Allow more than one answer: tapping toggles options (checked) and the user confirms with the send ' +
                'button — use for lists like "which place types matter". Default false = single-select, where ' +
                'tapping an option answers and advances immediately. Each question carries its own flag, so a single ' +
                'call may freely mix single- and multi-select questions.',
        ),
});

/** One clarification question — the unit a host UI renders. */
export type ClarifyIntentQuestion = z.infer<typeof questionSchema>;

/**
 * Input schema for {@link executeClarifyIntent}.
 */
export const clarifyIntentSchema = z.object({
    intro: z.string().optional().describe('One short line of context for why you need to ask.'),
    questions: z.array(questionSchema).min(1).max(4).describe('1-4 questions that resolve the ambiguity.'),
});

/**
 * Output schema for {@link executeClarifyIntent}. The tool resolves immediately, echoing back the
 * `intro` + `questions` (so a host can render the whole form) plus an `awaiting_user_response` status.
 * No "stop and wait" directive is echoed here: the description-level usage contract already carries it
 * (CLARIFY_FORM_PROMPT and CLARIFY_PROSE_PROMPT both tell the agent to STOP and wait), so repeating it
 * in the result would be redundant.
 */
export const clarifyIntentOutputSchema = z.object({
    status: z.literal('awaiting_user_response'),
    intro: z.string().optional(),
    questions: z.array(questionSchema),
});

/**
 * Default, domain-neutral description for the clarifyIntent tool. Override via
 * {@link createClarifyIntentTool} to add domain-specific guidance (e.g. which definitional choices
 * matter for your use case).
 */
export const clarifyIntentDescription =
    'Ask the user to resolve a genuinely ambiguous or missing input before acting — collects a few discrete ' +
    'choices as a short set of questions (numbered suggestions plus a freeform answer). Use it ONLY when you ' +
    'cannot proceed sensibly: a required input is missing with no reasonable default, or the request is genuinely ' +
    'ambiguous (e.g. an unclear concept, or which option matters most). Do NOT use it for a clear, actionable ' +
    'request — prefer acting with sensible defaults and stating them. Offer your best concrete suggestions. ' +
    'Batching a few related questions in a single call is fine; put any context in the `intro` field. After ' +
    'calling it, STOP and wait for the user — do not call other tools or answer until they reply.';

/** Usage contract appended to the description when the host renders the form: silent turn, questions not restated in prose. */
export const CLARIFY_FORM_PROMPT =
    '- When a request is missing inputs you need to act on, do NOT call the action tool with guessed or empty ' +
    'inputs, and do NOT ask for the missing details in prose — call clarifyIntent FIRST to collect them, then ' +
    'STOP and wait. Asking in a sentence when you could offer a form is the most common mistake; default to the form.\n' +
    '- Any question whose answer is a choice among a few concrete options IS a clarifyIntent form, even just two ' +
    'or three. If you catch yourself about to ask "A, B, or C?" in text, call clarifyIntent with those as options instead.\n' +
    '- A clarifyIntent call must be the ENTIRE turn: one tool call with EMPTY text content — no preamble, and ' +
    'NEVER restate the questions or options in the message (the form already shows them). Put any one-line ' +
    "context in the form's `intro` field, and give each question a few concrete options.\n" +
    '- One call can carry several related questions (the form shows them one at a time). Fall back to a prose ' +
    'question ONLY when the answer is genuinely free-form with no suggestable options.';

/** Usage contract appended to the description when there is no form: the model also writes the questions as prose so any UI shows them. */
export const CLARIFY_PROSE_PROMPT =
    '- When a request is missing inputs you need to act on, do NOT call the action tool with guessed or empty ' +
    'inputs — call clarifyIntent FIRST to collect them, then STOP and wait for the answer.\n' +
    '- Any question whose answer is a choice among a few concrete options belongs in clarifyIntent, even just ' +
    'two or three; offer your best concrete suggestions as its options.\n' +
    '- After calling clarifyIntent, present the questions as text in your reply: one short line of context, then a ' +
    'numbered markdown list of each question with its options (e.g. "1. How are people getting there? — Walking / ' +
    'Driving / Public transport"), then STOP and wait. This lets the user read and answer even when the host does ' +
    "not render a form. (Echoing the tool's own returned questions is presenting a result, not narrating — do it.)\n" +
    '- One call can carry several related questions. Fall back to a single prose question ONLY when the answer is ' +
    'genuinely free-form with no suggestable options.';

/** Default classifier hint for the clarifyIntent tool. */
export const clarifyIntentClassificationPrompt =
    'The request is under-specified or ambiguous and needs the user to choose among discrete options before the ' +
    'task can proceed; renders the questions as an in-chat survey form.';

/** Default usage examples for the clarifyIntent tool. */
export const clarifyIntentExamples = [
    'clarifyIntent({ intro: "A couple of details first.", questions: [{ id: "travelMode", question: "How are people getting there?", options: ["Walking", "Driving", "Public transport"] }] })',
    'clarifyIntent({ questions: [{ id: "priorities", question: "What matters most?", options: ["Speed", "Cost", "Comfort"], multiSelect: true }] })',
];

/**
 * Default natural-language prompts (shown by the help tool) for the clarifyIntent tool. The first is
 * a concrete maps prompt; the second is intentionally generic (it has implied, unstated options).
 */
export const clarifyIntentExamplePrompts = ['Plan a route for me', 'Help me decide between these options'];

/** Execute function for clarifyIntent — usable with ToolEntry format. Echoes the intro + questions. */
export const executeClarifyIntent = async (
    params: z.infer<typeof clarifyIntentSchema>,
    _state: ToolState,
): Promise<z.infer<typeof clarifyIntentOutputSchema>> => ({
    status: 'awaiting_user_response',
    intro: params.intro,
    questions: params.questions,
});

/** Per-call overrides accepted by {@link createClarifyIntentTool}. */
export type ClarifyIntentToolOptions = {
    /** Replace the default tool description (e.g. add domain-specific guidance). */
    description?: string;
    /** Replace the default classifier hint. */
    classificationPrompt?: string;
    /** Replace the default usage examples. */
    examples?: string[];
    /** Replace the default natural-language example prompts. */
    examplePrompts?: string[];
    /**
     * Keep the tool active on every step regardless of the classifier (so the agent can always ask
     * to clarify, even mid-task). Defaults to `true`; set `false` to leave activation to the classifier.
     */
    alwaysActive?: boolean;
    /**
     * Does your host render the clarifyIntent form? `true` → silent form contract; `false` (default) →
     * the agent narrates the questions as prose so they reach a form-less UI.
     */
    rendersForm?: boolean;
};

/**
 * Build a clarifyIntent {@link ToolEntry}, optionally overriding its description and examples for a
 * specific domain. The schema and `execute` are fixed; only the classifier-facing metadata is
 * customizable. Pass the result to `createMapAgent`'s `tools` option to replace the built-in default:
 *
 * ```typescript
 * createMapAgent(map, {
 *     model,
 *     tools: {
 *         clarifyIntent: createClarifyIntentTool({
 *             description: 'Ask before running a site analysis — surface demand anchors, competitors, scoring weights…',
 *             examplePrompts: ['Profile this site for me', 'Rank these addresses'],
 *         }),
 *     },
 * });
 * ```
 */
export const createClarifyIntentTool = (options: ClarifyIntentToolOptions = {}): ToolEntry => ({
    // rendersForm picks the usage contract; clarifyIntent is always active, so its description is always in context.
    description: `${options.description ?? clarifyIntentDescription}\n\n${options.rendersForm ? CLARIFY_FORM_PROMPT : CLARIFY_PROSE_PROMPT}`,
    classificationPrompt: options.classificationPrompt ?? clarifyIntentClassificationPrompt,
    inputSchema: clarifyIntentSchema,
    outputSchema: clarifyIntentOutputSchema,
    execute: executeClarifyIntent,
    tags: ['utilities'],
    examples: options.examples ?? clarifyIntentExamples,
    examplePrompts: options.examplePrompts ?? clarifyIntentExamplePrompts,
    alwaysActive: options.alwaysActive ?? true,
    // Form mode is a single silent tool call (halt the loop on the call). Prose mode instead needs a
    // trailing step so the model can write the questions as text after the tool returns them, then stop
    // naturally on that no-tool-call step. Either way the "awaiting user" signal lives in the result's
    // `status: 'awaiting_user_response'`, not in a separate flag.
    endsTurnOnCall: options.rendersForm ?? false,
});
