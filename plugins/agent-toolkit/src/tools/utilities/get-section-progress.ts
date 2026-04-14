/**
 * @module agent-toolkit-tools
 */

import {
    getRouteProgressForSection,
    type SectionProps,
    type SectionType,
    sectionTypes,
} from '@tomtom-org/maps-sdk/core';
import { z } from 'zod';
import type { ToolState } from '../../types';

/**
 * Tool schema for getting section progress.
 */
export const getSectionProgressSchema = z.object({
    sectionType: z.enum(sectionTypes as [SectionType, ...SectionType[]]).describe('e.g. country|traffic|motorway|toll'),
    ids: z
        .array(z.string())
        .optional()
        .describe('Section IDs to query. If omitted, all sections of the given sectionType are returned.'),
});

export const getSectionProgressDescription =
    'Calculate the distance and travel time for one or more sections of the shown route. If ids is omitted, all sections of the given type are returned.';

/** Execute function for getSectionProgress — usable with ToolEntry format. */
export const executeGetSectionProgress = async (params: z.infer<typeof getSectionProgressSchema>, state: ToolState) => {
    const { sectionType, ids } = params;

    try {
        const lastRoutes = state.routing.currentRoutes;

        if (!lastRoutes || lastRoutes.features.length === 0) {
            return { error: 'No routes available. Use calculate-route first.' };
        }

        const results: object[] = [];

        for (const route of lastRoutes.features) {
            const sections = route.properties.sections[sectionType as SectionType];
            if (!sections) continue;

            for (const section of sections) {
                if (ids && ids.length > 0 && !ids.includes(section.id)) continue;

                const progress = getRouteProgressForSection(route, section as SectionProps);

                if (!progress) {
                    results.push({
                        sectionId: section.id,
                        error: 'Could not calculate progress for this section. The route may be missing progress data.',
                    });
                    continue;
                }

                results.push({
                    sectionId: section.id,
                    startPointIndex: section.startPointIndex,
                    endPointIndex: section.endPointIndex,
                    start: progress.start,
                    end: progress.end,
                    delta: progress.delta,
                });
            }
        }

        if (ids && ids.length > 0) {
            const foundIds = new Set(results.map((r) => (r as { sectionId: string }).sectionId));
            for (const id of ids) {
                if (!foundIds.has(id)) {
                    results.push({
                        sectionId: id,
                        error: `Could not find a section with type "${sectionType}" and id "${id}" in the last calculated routes.`,
                    });
                }
            }
        }

        if (results.length === 0) {
            return { error: `No sections of type "${sectionType}" found in the last calculated routes.` };
        }

        return { sectionType, sections: results };
    } catch (error) {
        return {
            error: `Failed to get section progress: ${error instanceof Error ? error.message : String(error)}`,
        };
    }
};
