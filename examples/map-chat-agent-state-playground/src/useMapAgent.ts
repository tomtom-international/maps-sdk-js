import { TomTomConfig, type TrafficAreaAnalytics } from '@tomtom-org/maps-sdk/core';
import { TomTomMap, type TrafficAreaAnalyticsModule } from '@tomtom-org/maps-sdk/map';
import { type ClassificationResult, createMapAgent } from '@tomtom-org/maps-sdk-plugin-agent-toolkit';
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
    // Ordered list of classifier outputs — one entry per assistant turn (step 0). The chat panel
    // zips this list with the assistant messages in `thread.messages` so each turn's chip renders
    // above its own tool calls, instead of one global "latest" chip at the top of the panel.
    // `null` entries mean fail-open for that turn (classifier returned null).
    const [classifications, setClassifications] = useState<readonly (ClassificationResult | null)[]>([]);

    useEffect(() => {
        TomTomConfig.instance.put({ apiKey: API_KEY });

        const map = new TomTomMap({
            mapLibre: {
                container: 'sdk-map',
                center: [4.9041, 52.3676],
                zoom: 12,
            },
        });

        const agent = createMapAgent(map, {
            model: createDemoAzure().chat(deploymentId),
            maxSteps: 10,
            tools: { getCustomLocation: getCustomLocationTool },
            onClassify: (result) => setClassifications((prev) => [...prev, result]),
        });

        // Per-dataset slice now — react to `shown-change` and bind the panel to the most
        // recently rendered dataset's data + lazy-initialised module.
        const ttaSlice = agent.state.trafficAreaAnalytics;
        const syncLatestShown = async (shownIds: ReadonlySet<string>) => {
            if (shownIds.size === 0) {
                setAnalyticsState(null);
                return;
            }
            const latest = [...ttaSlice.datasets].reverse().find((e) => shownIds.has(e.id));
            if (!latest) {
                setAnalyticsState(null);
                return;
            }
            const module = await ttaSlice.getDatasetModule(latest.id);
            setAnalyticsState({ analytics: latest.data, module });
        };
        const unsubShownChange = ttaSlice.events.on('shown-change', syncLatestShown);
        void syncLatestShown(ttaSlice.shownDatasetIds);

        setAgentInstance(agent);

        // Instrumented transport tracks queries, tool calls, and token usage via Azure Application Insights
        // to help us improve the demo. It also tells the model what the side panel changed since its last
        // reply, so opting out with new DirectChatTransport({ agent }) drops that note too.
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
            setClassifications([]);
            agent.destroy();
            map.mapLibreMap?.remove();
        };
    }, []);

    return {
        agent: agentInstance,
        transport,
        analyticsState,
        tokenUsage,
        classifications,
        isReady: transport !== undefined,
    };
}
