# Tool-selection scenarios

LLM-in-the-loop tests that verify the **map agent picks the right tool(s) for a
prompt**. Each per-tool file (e.g. `locate-place.test.ts`) drives a real
`createMapAgent` against a real model via [`@langwatch/scenario`] and asserts
which tools the agent *chose to call* — not what those tools do.

## What is real vs. mocked

The whole selection pipeline runs for real; only side-effects are stubbed:

- **Real:** the model call, the **step-0 classifier** (built by
  `createDefaultClassifier` unless disabled — these tests do **not** disable it),
  and every tool's real `description` + `inputSchema`. So a failure means the
  classifier scoped the surface wrong, or the model picked the wrong tool from a
  faithful set of definitions.
- **Mocked:** each tool's `execute` (see `buildMockedTools` in
  `map-agent-adapter.ts`). Listed tools return canned shapes from `SPECIFIC_MOCKS`;
  anything else returns `{ success: true }`. No geocoding, routing, or map
  mutation actually happens, and the `mockMap` satisfies the interface without a
  browser.

What this suite therefore does **not** cover: real tool execution / map
side-effects, and the classifier model-call quality in isolation (only its
output-merging helpers are unit-tested in `../prepare-step-helpers.test.ts`).

## Assertions

From `helpers.ts`:

- `expectAnyToolCalled(...names)` — passes if **any** of the named tools was
  called (logical OR).
- `expectNoneOfToolsCalled(...names)` — passes if **none** were (guardrail
  prompts that must not mutate the map).
- `expectToolCalledInOrder(...names)` — each tool called in a **separate, later**
  assistant step (proves a sequential flow, not a parallel batch).
- `expectToolCallCount(name, n)` — exact invocation count.

Success is asserted at the test level
(`expect(outcome.success, outcome.failureReason).toBe(true)`) so each test has a
self-explanatory failure message listing the tools the agent actually called.

## Running

The suite is **gated on model credentials**: `describe.skipIf(!MODEL)` skips
everything unless Azure env vars are set (see `config.ts`). Add them to
`plugins/agent-toolkit/.env`: `AZURE_RESOURCE_NAME`, `AZURE_API_KEY`,
`AZURE_DEPLOYMENT_ID` (optionally `AZURE_API_VERSION`).

```bash
pnpm --filter @tomtom-org/maps-sdk-plugin-agent-toolkit test:scenarios       # canonical set (~23 tests, ~40s, ~$0.50)
pnpm --filter @tomtom-org/maps-sdk-plugin-agent-toolkit test:scenarios:full  # SCENARIOS_FULL=1 — every registry examplePrompt (~121 tests, ~5–15 min, ~$5)
```

Each file has one hand-picked canonical test (always on) plus an
`it.each(REGISTRY_PROMPTS)` block gated behind `SCENARIOS_FULL=1`. The prompt
list comes from the tool registry (`getExamplePrompts`), so a registry edit
propagates to the tests on the next run.

[`@langwatch/scenario`]: https://github.com/langwatch/scenario
