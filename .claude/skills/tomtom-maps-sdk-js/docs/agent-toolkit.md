# Agent Toolkit Plugin Reference

Headless conversational agent that gives any LLM tool-based control over a `TomTomMap` and TomTom services.
Built on [Vercel AI SDK](https://ai-sdk.dev/) v7 (`ToolLoopAgent`, `DirectChatTransport`).
No chat UI and no LLM provider are bundled — bring both.

> [Public preview](https://docs.tomtom.com/legal/public-preview) — package is `@tomtom-org/maps-sdk-plugin-agent-toolkit`.

This is the **base reference**: setup, `MapAgentOptions`, the turn lifecycle, compacting history, and gotchas.
Subsystems live in `docs/agent-toolkit/` — read the matching file too.

## Sub-topic references

| Sub-topic | File | When to read |
|---|---|---|
| Tools registry & custom tools | `agent-toolkit/tools.md` | `DEFAULT_TOOLS` / `TOOL_NAMES`, `ToolEntry` / `ToolEntryBuilder`, add / replace / remove / hand-pick tools, `locatePlace` / `getViewportBias`, `createEventRule` function / `CreateEventRuleParams` / `resolveAfterMs`, `deriveDatasets` function / `DeriveDatasetsParams` / `SomeMultiInputIds`, save and restore with `eventRuleParamsOf` / `derivedDatasetParamsOf`, `createGetCurrentLocationTool`, `createClarifyIntentTool`, opt-in `executeMaplibreCode` / `createExecuteMaplibreCodeTool`, `getTrafficIncidents` `where`, route `stretch`, `searchedStretch` |
| Scope-aware data tools | `agent-toolkit/data-tools.md` | `analyseDatasets` (whether a result is kept, with `persist`) / `deriveDatasets` (whether its dataset stays live, with `persist`, keeps a history of its runs, with `keepHistory`, and starts empty, with `keepEmpty`) / `monitorDerivedDataset` / `createEventRule` / `clusterIncidents`, the sandbox and its injected identifiers, per-turn scoping, scopable custom tools |
| State | `agent-toolkit/state.md` | `ToolState` slices and their module accessors, tagged geometries ids, custom slices, dataset mode, `getStateDigest` |
| Classifier & system prompt | `agent-toolkit/prompt-and-classifier.md` | `createDefaultClassifier` (its `temperature`) / custom classifier, `classificationPrompt`, `alwaysActive`, `BASE_SYSTEM_PROMPT` / `SYSTEM_PROMPT_SECTIONS` / `composeSystemPrompt`, prefix / suffix, a `systemPrompt` function read every turn |
| BYOD | `agent-toolkit/byod.md` | `addByodSource` / `setByodLayers`, `DatasetProfile` (also on a derived BYOD dataset's `deriveDatasets` result), untrusted-data handling, the default public-https URL policy and `byod.validateSourceUrl` |

Read `${CLAUDE_SKILL_DIR}/docs/agent-toolkit/<filename>` directly.
For multi-topic tasks, read several.

---

## Imports

```ts
import {
    createMapAgent,
    createDefaultClassifier,
    DEFAULT_TOOLS,
    TOOL_NAMES,
    BASE_SYSTEM_PROMPT,
    composeSystemPrompt,
    SYSTEM_PROMPT_SECTIONS,
    DATASET_MODE_SLICE_NAMES,
    getViewportBias,
    locatePlace,
    type AnalysableDatasetKind,
    type CustomSystemPrompt,
    type DatasetModeSliceName,
    type MapAgentInstance,
    type MapAgentOptions,
    type StateSlice,
    type SystemPromptSection,
    type SystemPromptSectionOverrides,
    type ToolBuildOptions,
    type ToolEntry,
    type ToolEntryBuilder,
    type ToolState,
} from '@tomtom-org/maps-sdk-plugin-agent-toolkit';
```

## Installation

```bash
npm i @tomtom-org/maps-sdk @tomtom-org/maps-sdk-plugin-agent-toolkit ai zod
# Plus one Vercel AI SDK provider, e.g.:
npm i @ai-sdk/openai
```

Peer deps (all required): `@tomtom-org/maps-sdk` (`^1.0.0-rc.4`, any 1.x), `@tomtom-org/maps-sdk-plugin-map-theme`, `ai@^7.0.173`,
`zod@^4.6.7`, `maplibre-gl@^6.15.0`, `@turf/turf`, `chart.js`, `h3-js`.

---

## Quick start

```ts
import { TomTomConfig } from '@tomtom-org/maps-sdk/core';
import { TomTomMap } from '@tomtom-org/maps-sdk/map';
import { createMapAgent } from '@tomtom-org/maps-sdk-plugin-agent-toolkit';
import { openai } from '@ai-sdk/openai';
import type { ModelMessage } from 'ai';

TomTomConfig.instance.put({ apiKey: 'YOUR_API_KEY' });

const map = new TomTomMap({ mapLibre: { container: 'map' } });
const agent = createMapAgent(map, { model: openai('gpt-4o') });

// One-shot:
const { text } = await agent.generate({
    messages: [{ role: 'user', content: 'Find coffee shops near Dam Square' }],
});

// Streamed, keeping the history yourself: append every step's tool calls and results, since
// (await result.response).messages holds only the final step on AI SDK 7.
const messages: ModelMessage[] = [];
messages.push({ role: 'user', content: 'Find a bakery near Dam Square' });
const result = await agent.stream({ messages });
messages.push(...(await result.responseMessages));

// Chat UI: the agent is a real ToolLoopAgent — new DirectChatTransport({ agent }) with useChat.
```

`createMapAgent` returns a `ToolLoopAgent` (`MapAgentInstance`) with two extras:

```ts
agent.state;     // live ToolState (typed as your extended state when you pass custom slices)
agent.destroy(); // calls reset() on every state slice that implements StateSlice
```

---

## How a turn runs

1. **Intent classification** (step 0 of each user message) — a pre-pass (a second LLM call when the first answer fails
   validation) picks the subset of tools for the turn from each tool's `classificationPrompt`. For *scopable* tools (`analyseDatasets`, `deriveDatasets`, `createEventRule`, `clusterIncidents`) it also emits
   `toolScopes[<name>]` naming the dataset kinds the turn touches; `prepareStep` rebuilds those tools' `description` +
   `inputSchema` for the turn. Detail: `agent-toolkit/prompt-and-classifier.md`, `agent-toolkit/data-tools.md`.
2. **Tool loop** — the model calls tools until it answers, capped at `maxSteps` (default 10).
   Tools return compact summaries; full data lives in `agent.state`. The calls in one step run at the same time; a
   built-in tool naming a dataset that doesn't exist yet waits for the calls that started before it in that step, then
   looks again, so a search and an analysis of its results can share a step.

Results are stored as datasets with stable ids (`places-3`, `routes-1`) that the model re-reads with `recallState` —
*"add a stop after the first one"* works across turns.

---

## Compacting a long conversation

Every step resends the whole history. For an agent woken by events (monitoring, a game's AI player, any long-running
headless agent), history grows without bound: fold older turns into a running summary every few turns with
`compactMessages`, one model call per compaction. Stateless — the caller keeps `summary` and `messages`.

```ts
import { COMPACT_MESSAGES_INSTRUCTIONS, compactMessages } from '@tomtom-org/maps-sdk-plugin-agent-toolkit';

const compacted = await compactMessages({
    model: openai('gpt-4o-mini'),
    messages,                 // ModelMessage[] since the last compaction
    summary,                  // previous result's summary; omit the first time
    keepTurns: 2,             // latest turns kept verbatim; 0 folds everything
    maxWords: 150,            // default 150
    instructions: `${COMPACT_MESSAGES_INSTRUCTIONS} Keep every alert the user dismissed.`, // replace or extend
});
summary = compacted.summary;     // send it with the next turn, e.g. in the user message
messages = compacted.messages;   // the kept turns
if (compacted.usage) tokens += compacted.usage.totalTokens;
```

- A turn starts at a user message: the cut never separates an assistant's tool calls from their tool results.
- Folded turns reach the model as text: string and content-array messages alike, each tool call as name + input and
  each tool result, with every input and result cut to 200 characters.
- No call (and no `usage`) when there are no more than `keepTurns` turns; it returns the previous summary and every
  message.
- Throws an `Error` when the model replies with no text (a content filter, a reasoning-only reply): catch it and keep
  the old `summary` and `messages`, as nothing was folded.
- Default `COMPACT_MESSAGES_INSTRUCTIONS`: keep commitments, decisions and facts later turns can't recover; drop what
  fresh context carries again. Override with your agent's point of view and domain.
- `keepTurns` must be a whole number ≥ 0, otherwise it throws a `RangeError`.
- When no summary of the dropped content is needed, the AI SDK's `pruneMessages({ messages, reasoning, toolCalls, emptyMessages })` is cheaper: it drops reasoning and tool call/result parts from older messages with no model call.
- Guide: `guides/plugins/agent-toolkit/how-it-works.mdx#compacting-a-long-conversation`.

---

## `MapAgentOptions`

```ts
const agent = createMapAgent(map, {
    model: openai('gpt-4o'),                        // REQUIRED — throws when missing

    // System prompt — prefix / suffix / section overrides compose; a full string replaces everything
    systemPromptPrefix: 'You work for Acme Logistics.',   // preamble, no heading
    systemPromptSuffix: 'Always respond in Spanish.',     // under "ADDITIONAL INSTRUCTIONS:"
    // systemPrompt: { identity: '…' },                   // override named sections
    // systemPrompt: `${BASE_SYSTEM_PROMPT}\n\n…`,        // full replacement, ignores prefix/suffix
    // systemPrompt: () => ({ identity: persona() }),     // either form from a function, read every turn

    // Tools — merged over DEFAULT_TOOLS
    tools: {
        getFleetVehicle,                 // add
        setMapLocale: false,             // remove
        locatePlace: myCustomLocate,     // replace (ToolEntry or ToolEntryBuilder)
    },
    includeDefaultTools: true,           // false → only what `tools` lists

    // Per dataset kind, keyed by DatasetKind: places / routes / incidents / customGeometries /
    // trafficAreaAnalytics / byod / ranges
    datasets: {
        routes: { datasetMode: 'single' },
        byod: { enabled: false },        // drops byod from the data tools + its TOOLS_BY_DATASET_KIND tools
    },

    byod: {
        validateSourceUrl: (url) =>
            url.origin === 'https://data.example.com' ? { valid: true } : { valid: false, reason: 'Host not allowed' },
    },
    codeExecution: {
        timeoutMs: 10_000,               // browser sandbox only; default 10 s
        allowMainThreadFallback: false,  // default; true runs code in the page, NOT isolated, if the iframe can't start, and does not retry it
    },

    // Classifier
    classifier: createDefaultClassifier({ model: openai('gpt-4o-mini'), temperature: 0 }), // or a Classifier function, or false
    onClassify: (result) => console.log(result?.activeToolNames, result?.toolScopes),

    // Observability and loop control
    onToolExecute: ({ toolName, durationMs, isError, errorMessage }) => {},
    maxSteps: 10,
    outputSchemas: true,                 // false for providers without structured tool outputs
    prepareStep: async (info) => ({}),   // its activeTools are intersected with the classifier's. An
                                         // instructions or messages override persists: build instructions
                                         // from info.initialInstructions, and messages from
                                         // [...info.initialMessages, ...info.responseMessages]
    providerOptions: { openai: { reasoningEffort: 'low' } },
    stepProviderOptions: ({ activeTools, stepNumber }) => undefined, // merged over providerOptions per step

    state: { fleet: new FleetState() },  // custom slices only; built-ins are created for you
});
```

- `byod.validateSourceUrl` returns `{ valid: true } | { valid: false; reason: string }` (sync or async) and replaces the default policy, which loads only public `https:` URLs — `agent-toolkit/byod.md`.
- `featureFlags` exists but defines no flags.
- `agent.getCodeExecutionMode()` says where data-tool code runs, and the page CSP the browser sandbox needs is in
  `agent-toolkit/data-tools.md`.

### Type-safe custom state

```ts
interface MyState extends ToolState {
    fleet: FleetState;
}

const agent = createMapAgent<MyState>(map, {
    model,
    state: { fleet: new FleetState() },
});
agent.state.fleet;   // FleetState
agent.state.routing; // built-in slice
```

Slice catalogue and the custom-slice contract: `agent-toolkit/state.md`.

---

## Cleanup

```ts
agent.destroy();             // resets every slice that implements reset()
map.mapLibreMap?.remove();   // tear down MapLibre when unmounting
```

---

## Privacy

- Sent to the model provider: every message + system prompt; the classifier's copy (default classifier: up to 8 earlier messages × 300 chars, tunable via `createDefaultClassifier({ maxHistoryMessages, maxHistoryMessageLength })`; a custom classifier sends what it sends; `classifier: false` turns it off); tool results (places, addresses, coords, reverse-geocoded addresses, viewport, device location, `analyseDatasets` / `deriveDatasets` output over BYOD, ≤200 event rule events per event rule, more when querying all event rules).
- The provider is the integrator's processor: DPA, EEA region where offered.
- `agent.state` is in-memory only; `resetState` or `agent.destroy()` clears all of it. `single` dataset mode and dataset removal can drop data sooner, but don't count on that for erasure. No browser storage. Chat history is the integrator's: erasure = clear it + `agent.destroy()`.
- Send less: remove tools, `classifier: false`, replace a tool with one returning less, fold older turns with
  `compactMessages` (its call sends the folded turns once more, to the model you pass it).
- Guide: `guides/plugins/agent-toolkit/what-the-agent-sends.mdx`.

---

## Gotchas

- **Coordinates are `[lng, lat]`** everywhere.
- **Tools return summaries, not GeoJSON.** Custom tools should do the same: small JSON to the model, data to a state slice.
- **Modules are per dataset.** Each slice keeps lazy modules per dataset, reached through it: `getDatasetModule(id)` on every
  dataset slice (places take a `markerType`), plus `getDatasetGeometriesModule(id)` on `places` / `ranges` and
  `getDatasetPlacesModule(id)` on `ranges`. Prefer the slice writers (`addDataset({ label, data, … })`, or
  `upsertDataset({ id, label, data })` to keep one dataset in step with a live feed) plus `showDataset(id)` or the display tools.
- **Stateful custom tools need a recall path.** Store results on a `StateSlice` the model can re-read — it won't remember them.
- **`classifier: false` disables scoping.** Every tool is offered every turn and scopable tools keep their unscoped surface.
- **One run at a time per agent.** Scoping mutates the shared tool objects each turn (only `prepareStep` itself is
  serialised), and state is per agent. Create one agent per concurrent session.
- **`agent.tools` keeps the full surface.** A turn's scope reaches only that run, so
  `validateUIMessages({ messages, tools: agent.tools })` passes on a history whose calls used kinds the last turn left out.
