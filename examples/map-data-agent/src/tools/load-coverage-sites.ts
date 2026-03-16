// examples/map-data-agent/src/tools/load-coverage-sites.ts
import { bboxFromGeoJSON } from '@tomtom-org/maps-sdk/core';
import { tool } from 'ai';
import { z } from 'zod';
import type { ToolContext } from '@tomtom-org/maps-sdk-plugin-ai-agent';
import type { AnalysisServices } from '../analysis-services';

const loadCoverageSitesOutputSchema = z.union([
    z.object({
        siteCount: z.number(),
        sites: z.array(z.object({ id: z.string(), name: z.string() })),
        bbox: z.tuple([z.number(), z.number(), z.number(), z.number()]).nullable(),
    }),
    z.object({ error: z.string() }),
]);

const loadCoverageSitesSchema = z.object({
    url: z.string().describe('URL returning a JSON array of service center objects'),
});

export function createLoadCoverageSitesTool(context: ToolContext<AnalysisServices>) {
    return tool({
        description:
            'Load service center locations from a JSON URL and store them in agent state. ' +
            'Calls the provided URL. Returns site names and bbox [minLng, minLat, maxLng, maxLat]. ' +
            'Call showCoverageAnalysis after this to compute and display coverage.',
        inputSchema: loadCoverageSitesSchema,
        outputSchema: loadCoverageSitesOutputSchema,
        execute: async (params) => {
            try {
                const response = await fetch(params.url);
                if (!response.ok) return { error: `Fetch failed: ${response.status}` };
                const sites: Array<{ id: string; name: string; lng: number; lat: number }> = await response.json();

                for (const site of sites) {
                    context.services.addServiceCenter({ id: site.id, name: site.name, position: [site.lng, site.lat] });
                }

                const geojson = {
                    type: 'FeatureCollection' as const,
                    features: sites.map((s) => ({
                        type: 'Feature' as const,
                        geometry: { type: 'Point' as const, coordinates: [s.lng, s.lat] },
                        properties: {},
                    })),
                };
                return {
                    siteCount: sites.length,
                    sites: sites.map((s) => ({ id: s.id, name: s.name })),
                    bbox: bboxFromGeoJSON(geojson) ?? null,
                };
            } catch (error) {
                return { error: `Failed to load sites: ${error instanceof Error ? error.message : String(error)}` };
            }
        },
    });
}
