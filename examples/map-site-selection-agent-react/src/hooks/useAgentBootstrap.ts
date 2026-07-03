import { TomTomConfig } from '@tomtom-org/maps-sdk/core';
import { TomTomMap } from '@tomtom-org/maps-sdk/map';
import { createMapAgent } from '@tomtom-org/maps-sdk-plugin-agent-toolkit';
import type { ChatTransport } from 'ai';
import { useEffect, useState } from 'react';
import { setActiveToolState } from '../agent/agent-bridge';
import { buildSiteAgentOptions } from '../agent/site-agent';
import { API_KEY, createDemoAzure } from '../config';
import { type AgentUIMessage, createAgentTelemetry } from '../telemetry';

export type AgentInstance = ReturnType<typeof createMapAgent>;

type BootstrapOptions = {
    deploymentId: string;
};

// Demo starting view.
const BERLIN_CENTRE: [number, number] = [13.405, 52.52];

/**
 * Owns map + agent lifecycle. The map is created once; the agent re-instantiates when the
 * deployment id changes so users can swap models in-session without losing the camera.
 *
 * SCOPED co-pilot: the agent configuration (scoped system prompt, the seven domain tools, the
 * hand-picked non-overlapping generic tools, and the meta-tool-preserving classifier) lives in
 * `../agent/site-agent` so the shipped agent and the scenario tests build the exact same thing —
 * here we only add the runtime map, model, and the `onClassify` UI hook.
 */
export function useAgentBootstrap({ deploymentId }: BootstrapOptions) {
    const [map, setMap] = useState<TomTomMap | undefined>(undefined);
    const [agent, setAgent] = useState<AgentInstance | undefined>(undefined);
    const [transport, setTransport] = useState<ChatTransport<AgentUIMessage> | undefined>(undefined);

    useEffect(() => {
        TomTomConfig.instance.put({ apiKey: API_KEY });

        const created = new TomTomMap({
            style: 'monoLight',
            mapLibre: {
                container: 'map-container',
                center: BERLIN_CENTRE,
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

        const model = createDemoAzure().chat(deploymentId);
        const conversationId = crypto.randomUUID();
        const telemetry = createAgentTelemetry(conversationId);
        const created = createMapAgent(map, {
            ...buildSiteAgentOptions(model),
            onClassify: telemetry.onClassify,
            onToolExecute: telemetry.onToolExecute,
        });

        setAgent(created);
        setTransport(telemetry.instrumentTransport(created));
        setActiveToolState(created.state); // let panels drive the map (click-to-focus, re-profile)

        return () => {
            setAgent(undefined);
            setTransport(undefined);
            setActiveToolState(null);
            created.destroy();
        };
    }, [map, deploymentId]);

    return { agent, transport, isReady: transport !== undefined };
}
