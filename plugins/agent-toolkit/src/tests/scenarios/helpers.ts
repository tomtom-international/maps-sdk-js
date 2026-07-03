import type { AgentAdapter } from '@langwatch/scenario';
import {
    createToolScenarioRunner,
    MapAgentToolCallAdapter,
    MODEL,
    type ToolScenarioOptions,
} from '@testing/agent-tool-calling';
import type { LanguageModel } from 'ai';
import { getDefaultToolPrompts, type ToolName } from '../../tools';
import { createScenarioAgent } from './map-agent-adapter';

// Agent-specific scenario plumbing. The generic pieces (model resolution, the scenario runner,
// assertions, seed staging) live in `@testing/agent-tool-calling` — import those directly from there.
// This file owns only what is specific to the map agent: the agent factory and the registry corpus.

// A fresh adapter (and agent) per scenario so each run starts clean. `runToolScenario` passes each
// configured model in turn; the few tests that build a custom script with `agentAdapter()` directly run
// against the primary model (MODEL).
export const agentAdapter = (model: LanguageModel = MODEL!): AgentAdapter =>
    new MapAgentToolCallAdapter(createScenarioAgent(model), 'MapAgent');

const baseRunToolScenario = createToolScenarioRunner(agentAdapter);

// clarifyIntent is an always-valid route: per the toolkit's default behaviour, a prompt with implied or
// missing context should be clarified rather than guessed. So accept it alongside whatever tool a
// scenario expects — a scenario passes when the agent routes to the expected tool OR appropriately asks
// to clarify. Wrong-tool routes and narrate-without-calling (no tool at all) still fail.
export const runToolScenario = (options: ToolScenarioOptions) =>
    baseRunToolScenario({
        ...options,
        acceptedAlternatives: [...(options.acceptedAlternatives ?? []), 'clarifyIntent'],
    });

// Materialize all default-tool prompts once at import time. Reuses the registry's own
// `getDefaultToolPrompts()` so this helper stays in lockstep with how chat-ui and other consumers see
// the same prompt set — single source of truth.
const ALL_REGISTRY_PROMPTS = getDefaultToolPrompts();

// Read the `examplePrompts` array for a single tool. Per-tool scenario files use this so a registry
// edit propagates to the tests on the next run.
export const getExamplePrompts = (toolName: ToolName): readonly string[] => ALL_REGISTRY_PROMPTS[toolName] ?? [];
