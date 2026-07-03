/**
 * @module agent-toolkit-tools/utilities
 *
 * Utility tools - pure functions that calculate values without side effects.
 */

export {
    calculateBBoxDescription,
    calculateBBoxOutputSchema,
    calculateBBoxSchema,
    executeCalculateBBox,
} from './calculate-bbox';
export {
    CLARIFY_FORM_PROMPT,
    CLARIFY_PROSE_PROMPT,
    type ClarifyIntentQuestion,
    type ClarifyIntentToolOptions,
    clarifyIntentClassificationPrompt,
    clarifyIntentDescription,
    clarifyIntentExamplePrompts,
    clarifyIntentExamples,
    clarifyIntentOutputSchema,
    clarifyIntentSchema,
    createClarifyIntentTool,
    executeClarifyIntent,
    questionSchema,
} from './clarify-user-intent';
export {
    executeGetCurrentLocation,
    getCurrentLocationDescription,
    getCurrentLocationOutputSchema,
    getCurrentLocationSchema,
} from './get-current-location';
export { createHelpTool, helpDescription, helpOutputSchema, helpSchema } from './help';
