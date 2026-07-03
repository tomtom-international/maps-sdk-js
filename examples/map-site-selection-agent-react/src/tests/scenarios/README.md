# Tool-selection scenarios

LLM-in-the-loop tests that verify the **Site Selection agent picks the right tool(s)
for a prompt**. Each per-tool file (e.g. `profile-site.test.ts`) drives the **real
shipped agent** — built from `src/agent/site-agent.ts`, the exact same scoped system
prompt, classifier and tool set the app uses — against a real model via
[`@langwatch/scenario`], and asserts which tools the agent *chose to call*, not what
those tools do.

## What is real vs. mocked

- **Real:** the model call, the step-0 classifier (`createDefaultClassifier`, wrapped
  by `keepGenericToolsActive`), the scoped system prompt, and every tool's real
  `description` + `inputSchema` + `classificationPrompt`. A failure means the classifier
  scoped the surface wrong, or the model picked the wrong tool from a faithful set.
- **Mocked:** each tool's `execute` (see `buildMockedSiteTools` in `site-agent-adapter.ts`)
  and a `mockMap` that satisfies the interface without a browser. No geocoding, analysis or
  map mutation actually happens. The SDK + plugin are resolved to source in
  `vitest.scenarios.config.ts` (same as the agent-toolkit's own scenario config).

## Files

The generic plumbing — Azure model resolution, the scenario runner, the `expect*` script steps, and
`priorTurn` staging — lives in the shared **`@testing/agent-tool-calling`** package (also used by the
agent-toolkit's own scenario suite). Only the site-agent-specific bits live here:

- `site-agent-adapter.ts` — `createScenarioSiteAgent` (the shipped agent against `mockMap` with mocked
  executes) + `buildMockedSiteTools`.
- `helpers.ts` — binds the agent factory into `runToolScenario` (via `createToolScenarioRunner`) and
  exposes `getExamplePrompts` (reads each tool's own `examplePrompts` — single source of truth).
- `seed.ts` — `analysesRunSeed`, built on the shared `priorTurn`.
- `<tool>.test.ts` — one per **custom** tool (the site-specific surface). `sanity.test.ts` — a small
  **no-collision** suite only: the generic built-ins' own routing is already covered by the agent-toolkit
  scenarios, so this just asserts a generic request ("where is X" / "go to X") is not hijacked by a
  domain tool.

## Running

The agent and SDK packages must be built first (the example imports their built `dist/`):

```sh
pnpm build && pnpm build:plugins
```

Add `AZURE_*` to `examples/.env` (same vars the example app uses): `AZURE_RESOURCE_NAME`,
`AZURE_API_KEY`, and the model list — `AZURE_MODEL_IDS` (comma-separated, preferred) or a single
`AZURE_DEPLOYMENT_ID`, defaulting to `gpt-5.1,gpt-4.1`. **Every scenario runs against each model** and
passes only when all do. The act / never-narrate / clarify-on-implied-or-missing-context behaviour is
inherited from the toolkit base prompt (not restated here).

```sh
# Canonical smoke tests only (first examplePrompt per tool) — fast, CI default.
pnpm -F @examples/map-site-selection-agent-react test:agent-tool-calling

# Full registry fan-out across every examplePrompt — slow, before touching prompts/tools.
pnpm -F @examples/map-site-selection-agent-react test:agent-tool-calling:full
```

## Assertions

Success is asserted at the test level — `expect(outcome.success, outcome.failureReason).toBe(true)` —
so each test visibly asserts and the failure message lists the tools the agent actually called.

- `expectAnyToolCalled(...names)` — passes if **any** named tool was called (OR).
- `expectNoneOfToolsCalled(...names)` — passes if **none** were (used for no-collision checks).

`runToolScenario` takes `expectedTool`, `prompt`, optional `acceptedAlternatives`,
`forbiddenTools`, and `priorTurns`.

[`@langwatch/scenario`]: https://github.com/langwatch/scenario
