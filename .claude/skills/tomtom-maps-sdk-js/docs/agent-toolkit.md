# Agent Toolkit Plugin Reference

Headless conversational agent that gives any LLM tool-based control over a `TomTomMap` and TomTom services.
Built on [Vercel AI SDK](https://ai-sdk.dev/) v6 (`ToolLoopAgent`, `DirectChatTransport`).
No UI is bundled — bring your own chat.
No LLM provider is bundled — bring any AI SDK-compatible model.

> Public preview — package is `@tomtom-org/maps-sdk-plugin-agent-toolkit`.

This is the **base reference**: setup, quick start, the turn lifecycle, `MapAgentOptions`, and gotchas.
Deep-dive subsystems live in `docs/agent-toolkit/` — match your task below and read that file too.

## Sub-topic references

| Sub-topic | File | When to read |
|---|---|---|
| Tools registry & custom tools | `agent-toolkit/tools.md` | `DEFAULT_TOOLS`, `ToolEntry` / `ToolEntryBuilder` shape, add / replace / remove / hand-pick tools |
| Scope-aware data tools | `agent-toolkit/data-tools.md` | `analyseData` / `processData`, sandbox & threat model, per-turn scoping, scopable custom tools, `getTrafficIncidents` `where` schema |
| State | `agent-toolkit/state.md` | `ToolState` slices, common reads, tagged geometries-id discriminator, custom state slices, entry mode |
| Classifier & system prompt | `agent-toolkit/prompt-and-classifier.md` | Swapping / disabling the classifier, tuning `classificationPrompt`, shaping `BASE_SYSTEM_PROMPT` via prefix / suffix / section overrides |
| BYOD | `agent-toolkit/byod.md` | Bring-your-own-data ingest, `BYODDataProfile`, untrusted-data handling, URL fetch policy, `setByodLayers` styling |

Use `Glob` with pattern `.claude/skills/tomtom-maps-sdk-js/docs/agent-toolkit/<filename>` to locate a sub-doc, then read it.
For multi-topic tasks, read several.

---

## Imports

```ts
import {
    createMapAgent,
    createDefaultClassifier,
    DEFAULT_TOOLS,
    BASE_SYSTEM_PROMPT,
    composeSystemPrompt,
    SYSTEM_PROMPT_SECTIONS,
    type SystemPromptSection,
    type SystemPromptSectionOverrides,
    ENTRY_MODE_SLICE_NAMES,
    type EntryDataKind,
    type EntryModeSliceName,
    type ToolEntry,
    type ToolBuildOptions,
    type ToolEntryBuilder,
    type ToolState,
    type StateSlice,
    type MapAgentOptions,
    type MapAgentInstance,
} from '@tomtom-org/maps-sdk-plugin-agent-toolkit';
```

## Installation

```bash
npm i @tomtom-org/maps-sdk @tomtom-org/maps-sdk-plugin-agent-toolkit ai zod
# Plus one Vercel AI SDK provider, e.g.:
npm i @ai-sdk/openai
```

Peer deps: `@tomtom-org/maps-sdk`, `ai@^6`, `zod`, `maplibre-gl`, `@turf/turf`, `chart.js`, `h3-js`.

---

## Quick start

```ts
import { TomTomConfig } from '@tomtom-org/maps-sdk/core';
import { TomTomMap } from '@tomtom-org/maps-sdk/map';
import { createMapAgent } from '@tomtom-org/maps-sdk-plugin-agent-toolkit';
import { openai } from '@ai-sdk/openai';

TomTomConfig.instance.put({ apiKey: 'YOUR_API_KEY' });

const map = new TomTomMap({ mapLibre: { container: 'map' } });
const agent = createMapAgent(map, { model: openai('gpt-4o') });

// One-shot generate:
const { text } = await agent.generate({
    messages: [{ role: 'user', content: 'Find coffee shops near Dam Square' }],
});

// Or stream into a chat UI via DirectChatTransport (the returned agent is a real ToolLoopAgent).
```

`createMapAgent` returns a `ToolLoopAgent` augmented with two extras:

```ts
agent.state;     // live ToolState (typed as the generic ToolState parameter, e.g. `MyState`, when custom slices are provided)
agent.destroy(); // resets every state slice that implements StateSlice.reset()
```

---

## How a turn runs

Two phases per user message:

1. **Intent classification** — a lightweight pre-pass picks the minimal subset of tools relevant to the turn
   from each tool's `classificationPrompt`.
   For *scopable* tools (`analyseData`, `processData`), the classifier also emits a `toolScopes[<name>]` value
   naming the kinds of entries the turn touches — mandatory whenever a scopable tool is selected.
   `prepareStep` validates the scope against the tool's `scopeSchema` and rebuilds that tool's
   `description` + `inputSchema` for the upcoming step from a terse default into a per-kind narrowed surface.
   The narrowing is invisible to the model — it just sees a smaller, more focused prompt.
   (Full mechanics in `agent-toolkit/data-tools.md` and `agent-toolkit/prompt-and-classifier.md`.)
2. **Tool loop** — the LLM calls tools (geocode, search, route, show on map, …) sequentially or in parallel.
   Tools return compact summaries, never raw GeoJSON.
   Full data lives in `state` for follow-up tools.

State persists across turns — *"add a stop after the first one"* and *"what were those restaurants again?"*
both work because the agent recalls from internal stores via dedicated recall tools.

---

## `MapAgentOptions`

```ts
const agent = createMapAgent(map, {
    // REQUIRED
    model: openai('gpt-4o'),

    // System prompt (optional) — prefix/suffix/section-overrides all compose; a full string replaces everything
    systemPromptPrefix: 'You work for Acme Logistics.',        // prepended preamble (no heading)
    systemPromptSuffix: 'Always respond in Spanish.',          // appended under "ADDITIONAL INSTRUCTIONS:"
    // systemPrompt: { identity: '…', responseFormatting: '…' }, // override named sections; omitted ones keep defaults
    // systemPrompt: BASE_SYSTEM_PROMPT + '\n\n…',             // full replacement (ignores prefix/suffix)

    // Tools (optional — merged with DEFAULT_TOOLS)
    tools: {
        getFleetVehicle,                 // add a custom tool
        setLanguage: false,              // remove a default tool
        locatePlace: myCustomLocate,     // replace a default tool (full ToolEntry)
    },
    includeDefaultTools: true,           // false → start blank, add only what you list

    // Per-data-entry-kind config (keyed by LLM-facing kind names: routes / incidents / …)
    dataEntries: {
        routes: { entryMode: 'single' },       // only one route at a time
        incidents: { entryMode: 'single' },
        byod: { enabled: false },              // drop byod from analyseData/processData scope + addByodSource/setByodLayers/updateByodDisplay
    },

    // Classifier (optional)
    classifier: createDefaultClassifier({ model: openai('gpt-4o-mini') }),  // cheaper model
    // classifier: false,                                                    // disable (scopable tools fall back to terse unscoped surface)
    onClassify: (result) => console.log(result?.activeToolNames, result?.toolScopes),

    // Custom state (optional)
    state: { fleet: new FleetState() },  // only custom slices; built-in slices are auto-created

    // Feature flags
    featureFlags: { experimentalSearch: true },   // route discoverPlaces through explorationSearch (more input fields)

    // Misc
    maxSteps: 10,                        // tool-loop iteration cap
    outputSchemas: true,                 // structured output schemas; set false for providers that don't support them
    prepareStep: async (info) => ({ /* ... */ }),  // composed with internal classification
});
```

### Type-safe custom state

```ts
interface MyState extends ToolState {
    fleet: FleetState;
}

const agent = createMapAgent<MyState>(map, {
    model,
    state: { fleet: new FleetState() },
});
agent.state.fleet;            // FleetState — typed
agent.state.routing;          // built-in slice
```

See `agent-toolkit/state.md` for the full slice catalogue and custom-slice contract.

---

## Cleanup

```ts
agent.destroy();             // resets all state slices that implement reset()
map.mapLibreMap?.remove();   // tear down MapLibre when unmounting
```

---

## Gotchas

- **Coordinates are `[lng, lat]`** everywhere — GeoJSON order.
  The base system prompt teaches the LLM this; don't override it without preserving the rule.
- **Tools return summaries, not GeoJSON.** Full data stays in state.
  Custom tools should follow the same pattern (return small JSON, write GeoJSON to state).
- **Modules are per-entry.** There's no top-level `state.places.getPlacesModule()` —
  each entry has its own lazy `PlacesModule` / `GeometriesModule` / `RoutingModule` / `CustomGeoJSONModule` / `TrafficAreaAnalyticsModule`.
  Use the slice helpers (`state.places.addPlaceResult(...)`, `state.byod.addEntry(...)`, etc.) and the existing display tools,
  or `slice.getEntryModule(entryId)` for direct module access.
- **Recall tools exist for a reason.** Tool results are not retained in conversation history.
  If a custom tool produces stateful results, store them on a `StateSlice` and add a recall tool —
  don't expect the LLM to remember.
- **Scopable tools require scope** when picked by the classifier.
  The classifier output schema enforces this; classifier failures fall back to the terse unscoped surface
  (functional but less detailed in the `code` doc).
- **`classifier: false` disables scope mutation.** Scopable tools fall back to their terse unscoped form for every call.
  Enable a classifier (default or custom) to get the narrowed surface.
- **Single-concurrent-run per agent.** The scope-narrowing mechanism mutates the shared tool objects
  between classification and the model request.
  `prepareStep` serialises calls within an agent via a mutex; for parallel sessions, create one agent per session
  (the typical embedding-app pattern).
- **`model` is required.** No provider is bundled. The factory throws if you forget.
