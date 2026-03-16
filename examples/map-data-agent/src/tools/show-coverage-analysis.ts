// examples/map-data-agent/src/tools/show-coverage-analysis.ts
import { bboxFromGeoJSON } from '@tomtom-org/maps-sdk/core';
import { GeometriesModule, reachableRangeGeometryConfig } from '@tomtom-org/maps-sdk/map';
import { calculateReachableRanges } from '@tomtom-org/maps-sdk/services';
import { tool } from 'ai';
import { z } from 'zod';
import type { ToolContext } from '@tomtom-org/maps-sdk-plugin-ai-agent';
import type { AnalysisServices } from '../analysis-services';

const showCoverageAnalysisOutputSchema = z.union([
    z.object({
        success: z.literal(true),
        sitesAnalyzed: z.number(),
        timeBudgetMinutes: z.number(),
        summary: z.string(),
        bbox: z.tuple([z.number(), z.number(), z.number(), z.number()]).nullable(),
    }),
    z.object({ error: z.string() }),
]);

const showCoverageAnalysisSchema = z.object({
    timeBudgetMinutes: z.number().default(30).describe('Drive time in minutes for coverage calculation'),
});

export function createShowCoverageAnalysisTool(context: ToolContext<AnalysisServices>) {
    return tool({
        description:
            'Calculate and display the reachable area from each loaded service center. ' +
            'Context-dependent: requires loadCoverageSites to have been called first. ' +
            'Calls the TomTom Routing service for each site (sequential). ' +
            'Displays all coverage zones as a combined layer on the map. ' +
            'Returns a summary of sites analyzed and total coverage.',
        inputSchema: showCoverageAnalysisSchema,
        outputSchema: showCoverageAnalysisOutputSchema,
        execute: async (params) => {
            try {
                const { serviceCenters } = context.services;
                if (serviceCenters.length === 0) {
                    return { error: 'No service centers loaded — call loadCoverageSites first' };
                }

                const ranges = await calculateReachableRanges(
                    serviceCenters.map((site) => ({
                        origin: site.position,
                        budget: { type: 'timeMinutes' as const, value: params.timeBudgetMinutes },
                    })),
                );

                const geometriesModule = await GeometriesModule.get(
                    context.map.ttMap,
                    reachableRangeGeometryConfig(),
                );
                await geometriesModule.show(ranges);

                const bbox = bboxFromGeoJSON(ranges) ?? null;
                const summary = `${serviceCenters.length} service centers analyzed — ${params.timeBudgetMinutes}-minute coverage zones displayed`;
                context.services.setCoverageComplete(summary);

                return {
                    success: true,
                    sitesAnalyzed: serviceCenters.length,
                    timeBudgetMinutes: params.timeBudgetMinutes,
                    summary,
                    bbox,
                };
            } catch (error) {
                return { error: `Coverage analysis failed: ${error instanceof Error ? error.message : String(error)}` };
            }
        },
    });
}
