/**
 * @module map-agent-tools/utilities
 *
 * Utility tools - pure functions that calculate values without side effects.
 */

export { calculateBBoxDescription, calculateBBoxSchema, createCalculateBBoxTool } from './calculate-bbox';
export { createFormatDistanceTool, formatDistanceDescription, formatDistanceSchema } from './format-distance';
export { createFormatDurationTool, formatDurationDescription, formatDurationSchema } from './format-duration';
export {
    createGetCurrentLocationTool,
    getCurrentLocationDescription,
    getCurrentLocationOutputSchema,
    getCurrentLocationSchema,
} from './get-current-location';
export { createGetRouteProgressTool, getRouteProgressDescription, getRouteProgressSchema } from './get-route-progress';
export {
    createGetSectionBBoxTool,
    getSectionBBoxDescription,
    getSectionBBoxOutputSchema,
    getSectionBBoxSchema,
} from './get-section-bbox';
export {
    createGetSectionProgressTool,
    getSectionProgressDescription,
    getSectionProgressSchema,
} from './get-section-progress';
export { createHelpTool, helpDescription, helpSchema } from './help';
