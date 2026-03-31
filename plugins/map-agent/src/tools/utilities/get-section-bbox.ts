/**
 * @module map-agent-tools
 */

import { getSectionBBox, type SectionProps, type SectionType, sectionTypes } from '@tomtom-org/maps-sdk/core';
import { type Tool, tool } from 'ai';
import { z } from 'zod';
import type { ToolState } from '../../types';
import { toolErrorSchema } from '../shared-output-schemas';

/** Output schema for the get-section-bbox tool. */
export const getSectionBBoxOutputSchema = z.union([
    z.object({
        bbox: z.array(z.number()).describe('GeoJSON bbox [minLng, minLat, maxLng, maxLat]'),
    }),
    toolErrorSchema,
]);

/** Input schema for the get-section-bbox tool. */
export const getSectionBBoxSchema = z.object({
    sectionType: z.enum(sectionTypes as [SectionType, ...SectionType[]]).describe('e.g. country|traffic|motorway|toll'),
    id: z.string().describe('Section ID from getShownRouteSections or getSectionProgress'),
});

export const getSectionBBoxDescription =
    'Calculate the bounding box [minLng, minLat, maxLng, maxLat] for a specific section of the shown route. Use with flyTo to frame the section, or to query traffic incidents within it.';

/**
 * Create the get section bbox tool.
 */
export function createGetSectionBBoxTool(state: ToolState): Tool {
    return tool({
        description: getSectionBBoxDescription,
        inputSchema: getSectionBBoxSchema,
        outputSchema: getSectionBBoxOutputSchema,
        execute: async ({ sectionType, id }): Promise<z.infer<typeof getSectionBBoxOutputSchema>> => {
            try {
                const lastRoutes = state.routing.currentRoutes;

                if (!lastRoutes || lastRoutes.features.length === 0) {
                    return { error: 'No routes available. Use calculate-route first.' };
                }

                for (const route of lastRoutes.features) {
                    const sections = route.properties.sections[sectionType as SectionType];
                    if (!sections || !Array.isArray(sections)) continue;

                    const section = sections.find((s) => s.id === id);
                    if (
                        section &&
                        typeof section.startPointIndex === 'number' &&
                        typeof section.endPointIndex === 'number'
                    ) {
                        const bbox = getSectionBBox(route, section as SectionProps);

                        if (!bbox) {
                            return {
                                error: 'Could not calculate bounding box for the section. The section may have invalid indices.',
                            };
                        }

                        return { bbox };
                    }
                }

                return {
                    error: `Could not find a section with type "${sectionType}" and id "${id}" in the last calculated routes.`,
                };
            } catch (error) {
                return {
                    error: `Failed to get section bbox: ${error instanceof Error ? error.message : String(error)}`,
                };
            }
        },
    });
}
