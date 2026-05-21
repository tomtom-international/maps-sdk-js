/**
 * @module agent-toolkit-tools
 */

import {
    getSectionBBox,
    type Route,
    type SectionProps,
    type SectionType,
    sectionTypes,
} from '@tomtom-org/maps-sdk/core';
import { z } from 'zod';
import type { ToolState } from '../../types';
import { toolErrorSchema } from '../shared-output-schemas';

/** Output schema for the fit-route-section tool. */
export const fitRouteSectionOutputSchema = z.union([
    z.object({
        success: z.literal(true),
    }),
    toolErrorSchema,
]);

/**
 * Tool schema for fitting route section bounds.
 */
export const fitRouteSectionSchema = z.object({
    sectionType: z.enum(sectionTypes as [SectionType, ...SectionType[]]).describe('e.g. country|traffic|motorway|toll'),
    id: z.string().describe('From a shown route section'),
    padding: z.number().optional().describe('pixels, default: 50'),
});

export const fitRouteSectionDescription =
    'Fit the camera to a specific route section by type + ID (obtain ids from `recallRoutes({ id })` detail mode or via `analyseData` over routes). Requires a route on the map.';

/**
 * Execute fit route section.
 */
export const executeFitRouteSection = async (params: z.infer<typeof fitRouteSectionSchema>, state: ToolState) => {
    const { sectionType, id, padding = 50 } = params;

    try {
        // Get the currently shown routes from the map
        if (!state.routing.currentEntryModule) {
            return {
                error: 'No routing module initialized - no routes shown on map',
            };
        }

        const shown = state.routing.currentEntryModule.getShown();

        if (!shown.mainLines || shown.mainLines.features.length === 0) {
            return {
                error: 'No routes are currently displayed on the map. Please show a route first before fitting to a section.',
            };
        }

        const shownRoutes = shown.mainLines.features;

        // Find the section in the shown routes
        let targetRoute: Route | undefined;
        let targetSection: { id: string; startPointIndex: number; endPointIndex: number } | undefined;

        for (const route of shownRoutes) {
            const sections = route.properties.sections[sectionType as SectionType];
            if (sections && Array.isArray(sections)) {
                const foundSection = sections.find((s) => s.id === id);
                if (
                    foundSection &&
                    typeof foundSection.startPointIndex === 'number' &&
                    typeof foundSection.endPointIndex === 'number'
                ) {
                    targetSection = foundSection as {
                        id: string;
                        startPointIndex: number;
                        endPointIndex: number;
                    };
                    targetRoute = route;
                    break;
                }
            }
        }

        if (!targetRoute || !targetSection) {
            return {
                error: `Could not find a section with type "${sectionType}" and id "${id}" in any displayed route. Check the section type and id are correct.`,
            };
        }

        // Calculate the bbox for the section
        const bbox = getSectionBBox(targetRoute, targetSection as SectionProps);

        if (!bbox) {
            return {
                error: 'Could not calculate bounding box for the section. The section may have invalid indices.',
            };
        }

        // Fit the map to the section bbox
        state.baseMap.mapLibreMap.fitBounds(bbox, { padding });

        return { success: true };
    } catch (error) {
        return {
            error: `Failed to fit route section: ${error instanceof Error ? error.message : String(error)}`,
        };
    }
};
