import { TomTomConfig, type TrafficAreaAnalytics } from '@tomtom-org/maps-sdk/core';
import { TomTomMap, type TrafficAreaAnalyticsModule } from '@tomtom-org/maps-sdk/map';
import {
    createClarifyIntentTool,
    createMapAgent,
} from '@tomtom-org/maps-sdk-plugin-agent-toolkit';
import type { ChatTransport } from 'ai';
import { useEffect, useState } from 'react';
import { API_KEY, createDemoAzure, deploymentId } from './config';
import { AgentUIMessage, createInstrumentedTransport } from './telemetry';
import { getCustomLocationTool } from './tools/get-custom-location';

export type AnalyticsState = {
    analytics: TrafficAreaAnalytics;
    module: TrafficAreaAnalyticsModule;
} | null;

export type TokenUsage = { input: number; output: number; total: number };

const EMPTY_TOKEN_USAGE: TokenUsage = { input: 0, output: 0, total: 0 };

export function useMapAgent() {
    const [transport, setTransport] = useState<ChatTransport<AgentUIMessage> | undefined>(undefined);
    const [agentInstance, setAgentInstance] = useState<ReturnType<typeof createMapAgent> | undefined>(undefined);
    const [analyticsState, setAnalyticsState] = useState<AnalyticsState>(null);
    const [tokenUsage, setTokenUsage] = useState<TokenUsage>(EMPTY_TOKEN_USAGE);

    useEffect(() => {
        TomTomConfig.instance.put({ apiKey: API_KEY });

        const map = new TomTomMap({
            mapLibre: {
                container: 'sdk-map',
                center: [-0.1276, 51.5074],
                zoom: 12,
            },
        });

        const agent = createMapAgent(map, {
            model: createDemoAzure().chat(deploymentId),
            maxSteps: 10,
            tools: {
                getCustomLocation: getCustomLocationTool,
                clarifyIntent: createClarifyIntentTool({ rendersForm: true }),
            },
        });

        // Per-entry slice now — react to `shown-change` and bind the panel to the most
        // recently rendered entry's data + lazy-initialised module.
        const ttaSlice = agent.state.trafficAreaAnalytics;
        const syncLatestShown = async (shownIds: ReadonlySet<string>) => {
            if (shownIds.size === 0) {
                setAnalyticsState(null);
                return;
            }
            const latest = [...ttaSlice.entries].reverse().find((e) => shownIds.has(e.id));
            if (!latest) {
                setAnalyticsState(null);
                return;
            }
            const module = await ttaSlice.getEntryModule(latest.id);
            setAnalyticsState({ analytics: latest.data, module });
        };
        const unsubShownChange = ttaSlice.events.on('shown-change', syncLatestShown);
        void syncLatestShown(ttaSlice.shownEntryIds);

        setAgentInstance(agent);

        // Instrumented transport tracks queries, tool calls, and token usage via Azure Application Insights
        // to help us improve the demo.
        // To opt out, replace with: new DirectChatTransport({ agent })
        setTransport(
            createInstrumentedTransport(agent, {
                onUsage: (usage) =>
                    setTokenUsage((prev) => ({
                        input: prev.input + (usage.inputTokens ?? 0),
                        output: prev.output + (usage.outputTokens ?? 0),
                        total: prev.total + (usage.totalTokens ?? 0),
                    })),
            }),
        );
        return () => {
            unsubShownChange();
            setAnalyticsState(null);
            setTransport(undefined);
            setAgentInstance(undefined);
            setTokenUsage(EMPTY_TOKEN_USAGE);
            agent.destroy();
            map.mapLibreMap?.remove();
        };
    }, []);

    return {
        agent: agentInstance,
        transport,
        analyticsState,
        tokenUsage,
        isReady: transport !== undefined,
    };
}
