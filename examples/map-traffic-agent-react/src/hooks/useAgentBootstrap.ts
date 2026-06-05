import { TomTomConfig } from '@tomtom-org/maps-sdk/core';
import { TomTomMap } from '@tomtom-org/maps-sdk/map';
import { type ClassificationResult, createMapAgent } from '@tomtom-org/maps-sdk-plugin-agent-toolkit';
import type { ChatTransport } from 'ai';
import { useEffect, useState } from 'react';
import { TRAFFIC_MANAGER_SYSTEM_PROMPT } from '../agent/system-prompt';
import { API_KEY, createDemoAzure } from '../config';
import { AgentUIMessage, createInstrumentedTransport } from '../telemetry';

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
    const [classifications, setClassifications] = useState<readonly (ClassificationResult | null)[]>([]);

    useEffect(() => {
        // In Sandpack with the proxy bootstrap active, commonBaseURL is already
        // set to the BFF; this put() just adds apiKey (which the BFF ignores).
        // In local dev (no bootstrap), the API_KEY path runs as before.
        TomTomConfig.instance.put({ apiKey: API_KEY });

        const created = new TomTomMap({
            mapLibre: {
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

        const created = createMapAgent(map, {
            model: createDemoAzure().chat(deploymentId),
            maxSteps: 10,
            systemPrompt: TRAFFIC_MANAGER_SYSTEM_PROMPT,
            tools: {
                toggleTrafficIncidents: false,
            },
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
