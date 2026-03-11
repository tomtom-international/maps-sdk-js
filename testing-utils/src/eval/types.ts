import type { Map as MapLibreMap } from 'maplibre-gl';
import type {
    BaseMapModule,
    GeometriesModule,
    HillshadeModule,
    PlacesModule,
    POIsModule,
    RoutingModule,
    TrafficFlowModule,
    TrafficIncidentsModule,
} from 'map';

export type EvalSourceAndLayerIDs = {
    sourceID: string;
    layerIDs: string[];
};

export type EvalTokenUsage = {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
};

export type EvalTelemetry = {
    completed: boolean;
    error: string | null;
    userMessages: string[];
    steps: Array<{
        index: number;
        toolCalls: Array<{ name: string; input: unknown; output: unknown }>;
        usage: EvalTokenUsage;
    }>;
    totalUsage: EvalTokenUsage;
    classification: {
        groups: string[];
        activeToolNames: string[];
        timeMs: number;
        usage: EvalTokenUsage;
    } | null;
    agentText: string;
    wallClockMs: number;
};

export type EvalWindowModuleGetters = {
    getBaseMapModule?: () => Promise<BaseMapModule>;
    getGeometriesModule?: () => Promise<GeometriesModule>;
    getHillshadeModule?: () => Promise<HillshadeModule>;
    getPlacesModule?: () => Promise<PlacesModule>;
    getPOIsModule?: () => Promise<POIsModule>;
    getRoutingModule?: () => Promise<RoutingModule>;
    getTrafficFlowModule?: () => Promise<TrafficFlowModule>;
    getTrafficIncidentsModule?: () => Promise<TrafficIncidentsModule>;
};

export type EvalWindow = EvalWindowModuleGetters & {
    __evalTelemetry: EvalTelemetry;
    __evalReset: () => void;
    __evalSendMessage: (query: string) => void;
    mapLibreMap: MapLibreMap;
};

export type EvalGlobalThis = Partial<EvalWindow>;
