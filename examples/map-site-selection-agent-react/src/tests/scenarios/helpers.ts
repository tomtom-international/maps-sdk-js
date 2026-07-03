import { createToolScenarioRunner, MapAgentToolCallAdapter } from '@testing/agent-tool-calling';
import { getDefaultToolPrompts, type ToolName } from '@tomtom-org/maps-sdk-plugin-agent-toolkit';
import { buildSiteTools } from '../../agent/site-agent';
import { createScenarioSiteAgent } from './site-agent-adapter';

// Generic plumbing (model resolution, scenario runner, assertions, seed staging) lives in
// `@testing/agent-tool-calling`, shared with the agent-toolkit's own scenario suite — import those
// (FULL_SCENARIOS, MODEL, …) directly from there. Only the site-agent-specific bits live here: the
// agent factory and the prompt corpus.

// A fresh adapter (and agent) per scenario so each run starts clean; runToolScenario passes each
// configured model in turn.
export const runToolScenario = createToolScenarioRunner(
    (model) => new MapAgentToolCallAdapter(createScenarioSiteAgent(model), 'SiteSelectionAgent'),
);

// Reads `examplePrompts` straight off this agent's own tool entries (the custom Site Selection tools),
// falling back to the toolkit registry for the generic built-ins the sanity suite covers — so the test
// corpus is the SAME single source of truth the shipped tools declare.
const SITE_TOOLS = buildSiteTools();
const DEFAULT_TOOL_PROMPTS = getDefaultToolPrompts();
export const getExamplePrompts = (toolName: string): readonly string[] => {
    const entry = SITE_TOOLS[toolName];
    const ownPrompts = entry && typeof entry !== 'function' ? entry.examplePrompts : undefined;
    return ownPrompts ?? DEFAULT_TOOL_PROMPTS[toolName as ToolName] ?? [];
};
