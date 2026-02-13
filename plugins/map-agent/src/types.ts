/**
 * @module map-agent-types
 */

import type { Place, Places, Routes } from '@tomtom-org/maps-sdk/core';
import type {
    BaseMapModule,
    GeometriesModule,
    HillshadeModule,
    PlacesModule,
    POIsModule,
    RoutingModule,
    TomTomMap,
    TrafficFlowModule,
    TrafficIncidentsModule,
} from '@tomtom-org/maps-sdk/map';
import type { LanguageModel, ToolLoopAgent } from 'ai';

/**
 * Internal state maintained by the map agent across tool calls.
 *
 * This state retains full GeoJSON data from service calls so map tools
 * can render it without re-fetching. Module instances are cached for reuse.
 */
export interface MapAgentState {
    /** Accumulated search results — full GeoJSON retained for showPlaces(). */
    searchResultsHistory: Places[];

    /** Accumulated calculated routes — full GeoJSON retained for showRoute(). */
    routesHistory: Routes[];

    /** Last geocoded/resolved waypoints. */
    lastWaypoints?: Place[];

    /** Last single geocode result. */
    lastGeocodeResult?: Place;

    /** Lazily-initialized module instances (cached across tool calls). */
    modules: {
        places?: PlacesModule;
        routing?: RoutingModule;
        trafficFlow?: TrafficFlowModule;
        trafficIncidents?: TrafficIncidentsModule;
        pois?: POIsModule;
        geometries?: GeometriesModule;
        baseMap?: BaseMapModule;
        hillshade?: HillshadeModule;
    };
}

/**
 * Options for creating a map agent.
 */
export interface MapAgentOptions {
    /** AI SDK language model instance. REQUIRED — no default provider. */
    model: LanguageModel;

    /** Additional system prompt text appended to built-in prompt. */
    systemPromptSuffix?: string;

    /** Override individual tools or add custom ones. Merged with defaults. */
    tools?: Record<string, any>;

    /** Max multi-step tool loop iterations. Default: 10. */
    maxSteps?: number;
}

/**
 * Map agent instance returned by createMapAgent().
 */
export interface MapAgent {
    /** The ToolLoopAgent instance — pass to DirectChatTransport. */
    readonly agent: ToolLoopAgent;

    /** The full tool set — useful for server-side or manual streamText usage. */
    readonly tools: Record<string, any>;

    /** The composed system prompt string. */
    readonly systemPrompt: string;

    /** Live agent state (last results, module cache). Readonly externally. */
    readonly state: Readonly<MapAgentState>;

    /** Tear down: clears modules, resets state. */
    destroy(): void;
}

/**
 * Context passed to tool execution functions.
 */
export interface ToolContext {
    map: TomTomMap;
    state: MapAgentState;
}
