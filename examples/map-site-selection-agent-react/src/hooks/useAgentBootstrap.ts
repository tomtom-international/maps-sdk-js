import { TomTomConfig } from '@tomtom-org/maps-sdk/core';
import { TomTomMap } from '@tomtom-org/maps-sdk/map';
import { createMapAgent } from '@tomtom-org/maps-sdk-plugin-agent-toolkit';
import type { ChatTransport } from 'ai';
import { useEffect, useState } from 'react';
import { setActiveToolState } from '../agent/agent-bridge';
import { buildSiteAgentOptions } from '../agent/site-agent';
import { API_KEY, createDemoAzure } from '../config';
import { type AgentUIMessage, createAgentTelemetry } from '../telemetry';

type BootstrapOptions = {
    deploymentId: string;
};

// Demo starting view.
const LAS_VEGAS_CENTRE: [number, number] = [-115.155, 36.14];

/**
 * Owns map + agent lifecycle. The map is created once, and the agent is built on it for
 * `deploymentId`; a different id rebuilds only the agent, so the camera stays where it is.
 *
 * SCOPED co-pilot: the agent configuration (scoped system prompt, the eight domain tools, the
 * hand-picked non-overlapping generic tools, and the meta-tool-preserving classifier) lives in
 * `../agent/site-agent` so the shipped agent and the scenario tests build the exact same thing —
 * here we only add the runtime map, model, and the `onClassify` and `onToolExecute` telemetry hooks.
 */
export function useAgentBootstrap({ deploymentId }: BootstrapOptions) {
    const [map, setMap] = useState<TomTomMap | undefined>(undefined);
    const [transport, setTransport] = useState<ChatTransport<AgentUIMessage> | undefined>(undefined);

    useEffect(() => {
        TomTomConfig.instance.put({ apiKey: API_KEY });

        const created = new TomTomMap({
            style: 'monoLight',
            mapLibre: {
                container: 'map-container',
                center: LAS_VEGAS_CENTRE,
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

        setTransport(telemetry.instrumentTransport(created));
        setActiveToolState(created.state); // let panels drive the map (click-to-focus, re-profile)

        return () => {
            setTransport(undefined);
            setActiveToolState(null);
            created.destroy();
        };
    }, [map, deploymentId]);

    return { transport };
}
