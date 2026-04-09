/**
 * @module map-agent-tools
 */

import type { SectionsProps, SectionType } from '@tomtom-org/maps-sdk/core';
import { sectionTypes } from '@tomtom-org/maps-sdk/core';
import { z } from 'zod';
import type { ToolState } from '../../types';
import { toolErrorSchema } from '../shared-output-schemas';

/** Output schema for the get-shown-route-sections tool. */
export const getShownRouteSectionsOutputSchema = z.union([
    z.object({
        sectionType: z.string(),
        routes: z.array(
            z.object({
                routeIndex: z.number().describe('0=primary, 1+=alternative'),
                sections: z.array(z.unknown()).describe('startPointIndex/endPointIndex omitted'),
            }),
        ),
    }),
    toolErrorSchema,
]);

/** Input schema for the get-shown-route-sections tool. */
export const getShownRouteSectionsSchema = z.object({
    sectionType: z
        .enum(sectionTypes as [SectionType, ...SectionType[]])
        .describe(
            'carpool|carTrain|country|ferry|importantRoadStretch|lanes|leg|lowEmissionZone|motorway|pedestrian|roadShields|speedLimit|toll|tollVignette|traffic|tunnel|unpaved|urban|vehicleRestricted',
        ),
});

export const getShownRouteSectionsDescription =
    'Get sections of a specific type (e.g. toll, motorway, country, traffic) from the currently shown routes. Returns section data without coordinate point indices.';

/**
 * Execute get shown route sections.
 */
export async function executeGetShownRouteSections(
    params: z.infer<typeof getShownRouteSectionsSchema>,
    state: ToolState,
): Promise<z.infer<typeof getShownRouteSectionsOutputSchema>> {
    const { sectionType } = params;
    try {
        if (!state.routing.routingModule) {
            return { error: 'No routing module initialized - no routes shown on map' };
        }

        const shown = state.routing.routingModule.getShown();

        if (!shown.mainLines || shown.mainLines.features.length === 0) {
            return { error: 'No routes currently shown on the map' };
        }

        const routes = shown.mainLines.features
            .map((route) => {
                const sectionArray = (route.properties.sections as SectionsProps)[sectionType as keyof SectionsProps];

                if (!sectionArray || sectionArray.length === 0) return null;

                return {
                    routeIndex: route.properties.index,
                    sections: sectionArray.map((section) => {
                        const {
                            startPointIndex: _s,
                            endPointIndex: _e,
                            ...rest
                        } = section as Record<string, unknown> & {
                            startPointIndex?: unknown;
                            endPointIndex?: unknown;
                        };
                        return rest;
                    }),
                };
            })
            .filter((r) => r !== null);

        if (routes.length === 0) {
            return { error: `No "${sectionType}" sections found on any currently shown route` };
        }

        return { sectionType, routes };
    } catch (error) {
        return {
            error: `Failed to get shown route sections: ${error instanceof Error ? error.message : String(error)}`,
        };
    }
}
