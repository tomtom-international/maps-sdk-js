import type { ToolEntry, ToolState } from '@tomtom-org/maps-sdk-plugin-agent-toolkit';
import { z } from 'zod';
import type { SiteSelectionPatch, SiteToolState } from '../agent/site-selection-state';

// updateSitePreferences is a state-only tool: it changes the session defaults the analysis tools read
// (catchment, weights, demand anchors) so the user's standing choices stick across turns without being
// restated each time. It fetches and computes nothing. See the PR description.

const updateSitePreferencesSchema = z.object({
    concept: z.string().optional().describe('Default concept being sited, e.g. "specialty coffee".'),
    travelMode: z.enum(['walk', 'drive']).optional().describe('Default catchment mode for new analyses.'),
    walkReachMeters: z.number().positive().optional().describe('Default walking-catchment radius in metres.'),
    driveMinutes: z.number().positive().optional().describe('Default drive-time budget in minutes.'),
    demandAnchors: z
        .array(z.string())
        .optional()
        .describe('Default POI category terms that stand in for demand when scanning for whitespace.'),
    scoringWeights: z
        .object({
            reach: z.number().min(0),
            demand: z.number().min(0),
            competition: z.number().min(0),
            accessibility: z.number().min(0),
        })
        .partial()
        .optional()
        .describe('Default ranking weights. Partial — nudge one factor without restating the others.'),
});

type UpdateSitePreferencesInput = z.infer<typeof updateSitePreferencesSchema>;

export const updateSitePreferences: ToolEntry = {
    description:
        'Set the session defaults the analysis tools inherit — default concept, travel mode, catchment size, ' +
        'demand anchors, and ranking weights. Call this ONLY when the user states a STANDING preference to persist ' +
        'across requests, signalled by words like "from now on", "always", "by default", or "set my default…" ' +
        '("always use a 12-minute drive", "weight competition highest", "my default demand anchors are gyms and ' +
        'transit"). Do NOT call it for a value scoped to the current request — e.g. "rank these within a 10-min ' +
        'drive" or "scan with an 800 m radius" is a one-off parameter you pass to that analysis tool, not a ' +
        'preference. Changes defaults only; it does not run any analysis.',
    classificationPrompt:
        'The user states a STANDING / default preference to PERSIST across future requests ("from now on", ' +
        '"always", "by default") for catchment mode/size, scoring weights, demand anchors, or the concept — NOT a ' +
        'one-off value for an analysis they are asking to run now.',
    inputSchema: updateSitePreferencesSchema,
    execute: (async (params: UpdateSitePreferencesInput, state: ToolState) => {
        const patch: SiteSelectionPatch = params;
        const updated = (state as SiteToolState).siteSelection.update(patch);
        return {
            ok: true as const,
            preferences: updated,
            headline: 'Updated the session defaults for future analyses.',
            hint: 'Confirm the change in ONE short sentence; the new defaults apply to the next profile/rank/whitespace run unless overridden.',
        };
    }) as ToolEntry['execute'],
    examplePrompts: [
        'From now on use a 12-minute drive catchment',
        'Always weight competition highest when ranking',
        'My default demand anchors are gyms, transit stops and supermarkets',
        'Set the default concept to specialty coffee',
    ],
};
