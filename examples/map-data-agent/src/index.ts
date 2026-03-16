// examples/map-data-agent/src/index.ts
import { createAzure } from '@ai-sdk/azure';
import { TomTomConfig } from '@tomtom-org/maps-sdk/core';
import { TomTomMap } from '@tomtom-org/maps-sdk/map';
import { createMapAgent } from '@tomtom-org/maps-sdk-plugin-ai-agent';
import { setupEvalWindowHooks } from '@testing/ai-eval/runtime';
import { AnalysisServices } from './analysis-services';
import { createLoadCoverageSitesTool } from './tools/load-coverage-sites';
import { createShowCoverageAnalysisTool } from './tools/show-coverage-analysis';
import { API_KEY, AZURE_API_KEY, AZURE_DEPLOYMENT_ID, AZURE_RESOURCE_NAME } from './config';
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

// Custom services — injected via the services option
const services = new AnalysisServices();

// Lazy context: services is known, map populated after agent creation
const context: any = { services };

const agent = createMapAgent(map, {
    model: azure.chat(AZURE_DEPLOYMENT_ID),
    maxSteps: 10,
    services,
    tools: {
        loadCoverageSites: createLoadCoverageSitesTool(context),
        showCoverageAnalysis: createShowCoverageAnalysisTool(context),
    },
});

// Wire in map after creation — tools are called during stream(), not at construction
context.map = agent.context.map;

// Auto-run the analysis on page load
const run = async () => {
    const statusEl = document.getElementById('status')!;
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
    getGeometriesModule: () => agent.context.map.getGeometriesModule(),
    getPlacesModule: () => agent.context.map.getPlacesModule(),
    getRoutingModule: () => agent.context.map.getRoutingModule(),
    mapLibreMap: map.mapLibreMap,
    sendMessage: (query: string) => void agent.stream({ messages: [{ role: 'user', content: query }] }),
    reset: () => {
        services.reset();
    },
});
