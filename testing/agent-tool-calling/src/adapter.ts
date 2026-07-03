import { AgentAdapter, type AgentInput, type AgentReturnTypes, AgentRole } from '@langwatch/scenario';

// Anything `createMapAgent` returns satisfies this — a ToolLoopAgent with `.generate`. Typed
// structurally so this package depends on neither the SDK nor the agent-toolkit plugin (avoids a
// dependency cycle: the plugin's own tests consume this package).
type GeneratingAgent = {
    generate: (input: { messages: AgentInput['messages'] }) => Promise<{ response: { messages: unknown[] } }>;
};

/**
 * Wraps a map agent (anything with `.generate`) for @langwatch/scenario. Returns all response messages
 * so the scenario can detect tool calls via `state.hasToolCall()`. Construct a fresh one per scenario so
 * each run gets a clean agent: `() => new MapAgentToolCallAdapter(createMapAgent(map, options), 'MyAgent')`.
 */
export class MapAgentToolCallAdapter extends AgentAdapter {
    role = AgentRole.AGENT;
    name: string;

    private readonly agent: GeneratingAgent;

    constructor(agent: GeneratingAgent, name = 'MapAgent') {
        super();
        this.agent = agent;
        this.name = name;
    }

    async call(input: AgentInput): Promise<AgentReturnTypes> {
        const result = await this.agent.generate({ messages: input.messages });
        return result.response.messages as AgentReturnTypes;
    }
}
