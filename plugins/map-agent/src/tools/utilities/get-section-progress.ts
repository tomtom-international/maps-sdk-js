/**
 * @module map-agent-tools
 */

import {
    getRouteProgressForSection,
    type Route,
    type SectionProps,
    type SectionType,
    sectionTypes,
} from '@tomtom-org/maps-sdk/core';
import { type Tool, tool } from 'ai';
import { z } from 'zod';
import type { ToolContext } from '../../types';

/**
 * Tool schema for getting section progress.
 */
export const getSectionProgressSchema = z.object({
    sectionType: z
        .enum(sectionTypes as [SectionType, ...SectionType[]])
        .describe('The type of route section (e.g., "country", "traffic", "motorway", "toll")'),
    id: z.string().describe('The unique identifier of the section'),
});

/**
 * Create the get section progress tool.
 */
export function createGetSectionProgressTool(context: ToolContext): Tool {
    return tool({
        description:
            'Calculate the distance and travel time for a specific section of the last calculated route. Provide the section type (e.g., "country", "traffic", "motorway") and the section ID.',
        inputSchema: getSectionProgressSchema,
        execute: async (params) => {
            const { sectionType, id } = params;

            try {
                const lastRoutes = context.services.lastRoutes;

                if (!lastRoutes || lastRoutes.features.length === 0) {
                    return { error: 'No routes available. Use calculate-route first.' };
                }

                let targetRoute: Route | undefined;
                let targetSection: SectionProps | undefined;

                for (const route of lastRoutes.features) {
                    const sections = route.properties.sections[sectionType as SectionType];
                    if (sections && Array.isArray(sections)) {
                        const found = sections.find((s) => s.id === id);
                        if (
                            found &&
                            typeof found.startPointIndex === 'number' &&
                            typeof found.endPointIndex === 'number'
                        ) {
                            targetRoute = route;
                            targetSection = found as SectionProps;
                            break;
                        }
                    }
                }

                if (!targetRoute || !targetSection) {
                    return {
                        error: `Could not find a section with type "${sectionType}" and id "${id}" in the last calculated routes.`,
                    };
                }

                const progress = getRouteProgressForSection(targetRoute, targetSection);

                if (!progress) {
                    return {
                        error: 'Could not calculate progress for this section. The route may be missing progress data.',
                    };
                }

                return {
                    sectionType,
                    sectionId: id,
                    startPointIndex: targetSection.startPointIndex,
                    endPointIndex: targetSection.endPointIndex,
                    start: progress.start,
                    end: progress.end,
                    delta: progress.delta,
                };
            } catch (error) {
                return {
                    error: `Failed to get section progress: ${error instanceof Error ? error.message : String(error)}`,
                };
            }
        },
    });
}
