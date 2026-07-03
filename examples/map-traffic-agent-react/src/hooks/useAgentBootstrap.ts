import { TomTomConfig } from '@tomtom-org/maps-sdk/core';
import { TomTomMap } from '@tomtom-org/maps-sdk/map';
import { createClarifyIntentTool, createMapAgent } from '@tomtom-org/maps-sdk-plugin-agent-toolkit';
import type { ChatTransport } from 'ai';
import { useEffect, useState } from 'react';
import { TRAFFIC_MANAGER_PROMPT_OVERRIDES } from '../agent/system-prompt';
import { API_KEY, createDemoAzure } from '../config';
import { AgentUIMessage, createAgentTelemetry } from '../telemetry';

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

    useEffect(() => {
        // In Sandpack with the proxy bootstrap active, commonBaseURL is already
        // set to the BFF; this put() just adds apiKey (which the BFF ignores).
        // In local dev (no bootstrap), the API_KEY path runs as before.
        TomTomConfig.instance.put({ apiKey: API_KEY });

        const created = new TomTomMap({
            mapLibre: {
                container: 'map-container',
                center: [13.405, 52.52],
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

        const conversationId = crypto.randomUUID();
        const telemetry = createAgentTelemetry(conversationId);
        const created = createMapAgent(map, {
            model: createDemoAzure().chat(deploymentId),
            maxSteps: 10,
            // Layer the persona onto the toolkit's base prompt via section overrides
            // (instead of a full-string replacement) — see agent/system-prompt.ts.
            systemPrompt: TRAFFIC_MANAGER_PROMPT_OVERRIDES,
            tools: {
                toggleTrafficIncidents: false,
                clarifyIntent: createClarifyIntentTool({ rendersForm: true }),
            },
            onClassify: telemetry.onClassify,
            onToolExecute: telemetry.onToolExecute,
        });

        setAgent(created);
        setTransport(telemetry.instrumentTransport(created));

        return () => {
            setAgent(undefined);
            setTransport(undefined);
            created.destroy();
        };
    }, [map, deploymentId]);

    return { agent, transport, isReady: transport !== undefined };
}
