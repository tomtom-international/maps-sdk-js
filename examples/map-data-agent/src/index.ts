// examples/map-data-agent/src/index.ts
import { createAzure } from '@ai-sdk/azure';
import { setupEvalWindowHooks } from '@testing/ai-eval/runtime';
import { TomTomConfig } from '@tomtom-org/maps-sdk/core';
import { TomTomMap } from '@tomtom-org/maps-sdk/map';
import { createMapAgent } from '@tomtom-org/maps-sdk-plugin-ai-agent';
import { AnalysisServices } from './analysis-services';
import { API_KEY, AZURE_API_KEY, AZURE_DEPLOYMENT_ID, AZURE_RESOURCE_NAME } from './config';
import { createLoadCoverageSitesTool } from './tools/load-coverage-sites';
import { createShowCoverageAnalysisTool } from './tools/show-coverage-analysis';
import './style.css';

TomTomConfig.instance.put({ apiKey: API_KEY });

const map = new TomTomMap({
    mapLibre: {
        container: 'sdk-map',
        center: [4.9, 52.37], // Amsterdam
        zoom: 10,
    },
});

const azure = createAzure({ resourceName: AZURE_RESOURCE_NAME, apiKey: AZURE_API_KEY });

const services = new AnalysisServices();
const context = { map, services };

const agent = createMapAgent(map, {
    model: azure.chat(AZURE_DEPLOYMENT_ID),
    maxSteps: 10,
    tools: {
        loadCoverageSites: createLoadCoverageSitesTool(context),
        showCoverageAnalysis: createShowCoverageAnalysisTool(context),
    },
});

// Auto-run the analysis on page load
const run = async () => {
    const statusEl = document.getElementById('status') as HTMLElement;
    statusEl.textContent = 'Analyzing service center coverage...';

    try {
        const result = await agent.stream({
            messages: [
                {
                    role: 'user',
                    content:
                        'Load service center data from /data/service-centers.json and show the 30-minute coverage for each center.',
                },
            ],
        });

        statusEl.textContent = '';
        for await (const chunk of result.textStream) {
            statusEl.textContent += chunk;
        }

        statusEl.textContent = services.coverageSummary || 'Analysis complete.';
    } catch (error) {
        statusEl.textContent = `Error: ${error instanceof Error ? error.message : String(error)}`;
    }
};

map.mapLibreMap.on('load', () => void run());

// Expose analysis state for eval assertions
(globalThis as any).getAnalysisServices = () => services;

setupEvalWindowHooks({
    enabled: import.meta.env.VITE_EVAL_MODE === 'true',
    getGeometriesModule: () => agent.state.places.getGeometriesModule(),
    getPlacesModule: () => agent.state.places.getPlacesModule(),
    getRoutingModule: () => agent.state.routing.getRoutingModule(),
    mapLibreMap: map.mapLibreMap,
    sendMessage: (query: string) => void agent.stream({ messages: [{ role: 'user', content: query }] }),
    reset: () => {
        services.reset();
    },
});
