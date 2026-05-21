import { createAzure } from '@ai-sdk/azure';
import { TomTomConfig } from '@tomtom-org/maps-sdk/core';
import { TomTomMap } from '@tomtom-org/maps-sdk/map';
import { type ClassificationResult, createMapAgent } from '@tomtom-org/maps-sdk-plugin-agent-toolkit';
import type { ChatTransport } from 'ai';
import { useEffect, useState } from 'react';
import { TRAFFIC_MANAGER_SYSTEM_PROMPT } from '../agent/system-prompt';
import { API_KEY, azureConfig } from '../config';
import { AgentUIMessage, createInstrumentedTransport } from '../telemetry';

// Tools whose execution involves writing or running code (turf/h3 cluster
// snippets, MapLibre code). Bumping reasoning effort on these turns helps the
// model plan; the default `low` is enough for fetch/toggle/focus.
const CODE_EXEC_TOOLS = new Set(['analyseData', 'executeMaplibreCode']);

/**
 * Azure Foundry's Responses API validator rejects message items that lack a
 * top-level `type: "message"` field. `@ai-sdk/openai` emits the OpenAI-spec
 * shorthand (`{role, content}` only), which OpenAI accepts but Foundry does
 * not. Wrap fetch and inject the field on outbound requests.
 */
const foundryCompatFetch: typeof fetch = async (input, init) => {
    if (init?.body && typeof init.body === 'string') {
        try {
            const body = JSON.parse(init.body);
            if (Array.isArray(body.input)) {
                body.input = body.input.map((item: unknown) => {
                    if (
                        item &&
                        typeof item === 'object' &&
                        'role' in item &&
                        !('type' in (item as Record<string, unknown>))
                    ) {
                        return { type: 'message', ...item };
                    }
                    return item;
                });
                return fetch(input, { ...init, body: JSON.stringify(body) });
            }
        } catch {
            // Body wasn't JSON — leave it alone.
        }
    }
    return fetch(input, init);
};

export type AgentInstance = ReturnType<typeof createMapAgent>;

type BootstrapOptions = {
    deploymentId: string;
};

/**
 * Owns map + agent lifecycle for the example. The map is created once; the
 * agent re-instantiates whenever the deployment id changes so users can swap
 * models in-session without losing camera/state.
 */
export function useAgentBootstrap({ deploymentId }: BootstrapOptions) {
    const [map, setMap] = useState<TomTomMap | undefined>(undefined);
    const [agent, setAgent] = useState<AgentInstance | undefined>(undefined);
    const [transport, setTransport] = useState<ChatTransport<AgentUIMessage> | undefined>(undefined);
    // Per-turn classifier outputs in arrival order. The chat panel zips this list with the
    // assistant messages in `thread.messages` so each turn's chip can render above its own
    // tool calls instead of one global "latest" chip stuck at the top.
    const [classifications, setClassifications] = useState<readonly (ClassificationResult | null)[]>([]);

    useEffect(() => {
        TomTomConfig.instance.put({ apiKey: API_KEY });

        const created = new TomTomMap({
            mapLibre: {
                // Dedicated child container; `#sdk-map` wraps both the map and
                // the React-managed panel tree, and MapLibre wipes its own
                // container's children.
                container: 'map-container',
                center: [-0.1276, 51.5074],
                zoom: 12,
            },
        });
        setMap(created);

        return () => {
            setMap(undefined);
            created.mapLibreMap?.remove();
        };
    }, []);

    useEffect(() => {
        if (!map) return;

        const azure =
            azureConfig.mode === 'apim'
                ? createAzure({
                      baseURL: azureConfig.gatewayBaseUrl,
                      apiKey: 'placeholder',
                      fetch: foundryCompatFetch,
                  })
                : createAzure({
                      resourceName: azureConfig.resourceName,
                      apiKey: azureConfig.apiKey,
                      fetch: foundryCompatFetch,
                  });

        const created = createMapAgent(map, {
            model: azure.responses(deploymentId),
            maxSteps: 10,
            systemPrompt: TRAFFIC_MANAGER_SYSTEM_PROMPT,
            tools: {
                // Disable the vector-tile incident layer — this app uses the
                // Incident Details overlay (TrafficIncidentOverlayModule) for
                // richer per-feature interactions, and showing both at once
                // double-renders incidents on the map.
                toggleTrafficIncidents: false,
            },
            // Stream reasoning summaries from gpt-5.x. Without
            // `reasoningSummary` the model thinks but the API returns no
            // reasoning text — so the UI has nothing to render.
            providerOptions: {
                openai: { reasoningEffort: 'low', reasoningSummary: 'auto' },
            },
            stepProviderOptions: ({ activeTools }) =>
                activeTools?.some((name) => CODE_EXEC_TOOLS.has(name))
                    ? { openai: { reasoningEffort: 'low' } }
                    : undefined,
            onClassify: (result) => setClassifications((prev) => [...prev, result]),
        });

        setAgent(created);
        setTransport(createInstrumentedTransport(created));

        return () => {
            setAgent(undefined);
            setTransport(undefined);
            setClassifications([]);
            created.destroy();
        };
    }, [map, deploymentId]);

    return { agent, transport, classifications, isReady: transport !== undefined };
}
