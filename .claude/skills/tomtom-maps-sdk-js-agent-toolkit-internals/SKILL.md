---
name: tomtom-maps-sdk-js-agent-toolkit-internals
description: CONTRIBUTOR skill — editing the agent-toolkit plugin's own source in this monorepo, NOT using it to build an agent (for that, the tomtom-maps-sdk-js skill's agent-toolkit docs are the reference). Work on plugins/agent-toolkit: add, rename or remove a default LLM tool, add an entry-owning state slice, change a tool description / classificationPrompt / examplePrompts, touch the system prompt or the intent classifier, or work on the code-execution sandbox. Covers the contract rules that break the agent, the failure modes behind the plugin's wiring checklists, and which scenario or eval suite a change obliges you to run. Use whenever the task touches plugins/agent-toolkit source.
---

A headless agent between a language model, a live `TomTomMap`, TomTom services and MapLibre state.
The model honours clear contracts and misuses vague ones, so the work is contract design more than
plumbing.

**Read these two first — this skill does not restate them:**

- [`ENGINEERING-GUIDELINES.md`](../../../plugins/agent-toolkit/ENGINEERING-GUIDELINES.md) — *what a
  good tool looks like* (task-oriented over SDK parity, minimal descriptions, stable references,
  summaries over payloads).
- [`AGENTS.md`](../../../plugins/agent-toolkit/AGENTS.md) — the structure, and the per-change
  **wiring checklists** you must walk: § Cross-surface consistency (added a tool, added an
  entry-owning state slice, renamed or removed a public tool), § Scenario tests (the two suites and
  their costs), § Keeping docs and the SDK skill in sync (the three-surface docs matrix).

This skill is the part those two leave out: **why each checklist item bites, and what it looks like
when you miss it.** Most of these fail at runtime, or not at all until a model misroutes — none of
them fail at compile time.

## Contract rules with teeth

The ones that break the agent, not just the style:

- **Never throw from `execute`** — return `{ error: string }`, or a discriminated
  `{ status: 'not_found' | … }` when the model must branch. A throw escapes the AI SDK boundary as
  an opaque step failure it can't recover from. **Name the missing entity and the next valid
  action** (`"No routes available — call setRoute first."`); vague errors drive retry loops.
- **Summaries, never payloads** — counts, names, indexes, labels, status; geometry stays in state.
  Tool results aren't retained in conversation history, which is why state-retrieval tools exist
  and must be unambiguous.
- **No read-then-pass** — never make the model carry data from one tool into another; that invites
  hallucination. Read from shared state.
- **Map mutations are sequential** — `show()` / `hide()` / `clear()` and the slice-level shown sets
  have MapLibre ordering constraints, so `await` them one at a time, even across slices. Pure data
  work (geocode, route, search) still parallelises.
- **Entry IDs are the cross-tool currency** — every entry-owning slice issues `places-3`,
  `routes-1`, `byod-0`, and every recall / display / `analyseData` / `processData` tool takes them
  via the matching `*EntryIDs` field. A new scheme forces the model to learn a special case.
- **Scope needs a builder** — a static `ToolEntry` carrying a `scopeSchema` is silently never
  rebuilt (no factory for `prepareStep` to call), so the model sees the full surface whatever the
  classifier emitted. Scope-aware ⇒ `ToolEntryBuilder<Scope>` with `scopeSchema` + `scopePrompt`.
- **No overlapping descriptions** — two tools that could serve one request make the model misroute.
  Merge or remove one; if both must exist, each says what the other does not.

## Where things live

| File | Role |
|---|---|
| `src/tools/{services,maplibre,tomtom-map,state,utilities}/<tool>.ts` | one tool: `<name>Description`, `<name>Schema`, `<name>OutputSchema`, `execute<Name>` |
| `src/tools/<dir>/index.ts` | directory barrel — **explicit named exports**, not `export *` |
| `src/tools/tool-registry.ts` | `defaultTools` → `DEFAULT_TOOLS`, `TOOL_NAMES`, `ToolName`, `TOOLS_BY_DATA_ENTRY_KIND`, `getDefaultToolPrompts()` |
| `src/state/<slice>/{state,entry}.ts` | a slice's store and entry type |
| `src/state/state.ts` | `DataEntryKind` union + `DATA_ENTRY_KIND_TO_SLICE` |
| `src/state/digest.ts` | `getStateDigest` / `formatStateDigestDiff` |
| `src/tools/shared/entry-kinds.ts` | `ENTRY_KIND_META` — `*EntryIDs` field names, schema docs, `recallTool` |
| `src/system-prompt.ts` | `SYSTEM_PROMPT_SECTIONS`, `composeSystemPrompt` |
| `src/tests/constants.ts` | `createDefaultMock()` — the `ToolState` every tool test receives |
| `src/tests/scenarios/` | LLM tool-selection tests, driven off the registry |

## The failure modes behind the checklists

**Adding a tool.** Registering in `defaultTools` is what puts the name in `TOOL_NAMES` — an
exported-but-unregistered tool simply does not exist to the model. If it calls a
`@tomtom-org/maps-sdk/services` function, wrap its params with `withAgentToolkitHeaders`
(`tools/shared/agent-headers.ts`) so TomTom attributes the request to agent-toolkit; the guard test
(`tools/shared/tests/agent-headers.test.ts`) walks every `DEFAULT_TOOLS` entry generating input
from its own zod schema, so a missed tag fails automatically — as does a schema it can't generate
input for. Seed `examplePrompts` deliberately: **entry 0 becomes the canonical scenario
assertion.** New tools are *not* auto-covered (51 of 54 today), so a missing `describe` block
silently means no scenario coverage rather than a failure.

**Adding an entry-owning state slice** is the expensive one, because several paths iterate "every
slice" by hand. The trap is `src/tests/constants.ts`: `createDefaultMock()` ends in
`as unknown as ToolState`, so a slice missing there is **not** a type error — every tool test sees
`undefined` and fails with a property-of-undefined deep inside an unrelated test. Walk the whole
list in `AGENTS.md` § Cross-surface consistency; in `reset-state.ts` note that the pre-reset
module-clear loop and `state.<slice>.reset()` are *both* required, and that the session-level
`analyses` / `trackers` / `engine` resets there are separate — leave them alone.

**Renaming or removing a tool.** `git grep -l '<oldName>'` from the root, then sweep beyond the
barrel and registry: `system-prompt.ts` and every per-tool `description` / `classificationPrompt`
naming it, `TOOLS_BY_DATA_ENTRY_KIND`, `relatedTools` arrays, the examples' eval cases. The one
hit the compiler *does* give you is `src/tests/scenarios/` — an orphan `getExamplePrompts()`
argument is a type error, so `pnpm type-check:plugins` finds it; locate the owning file with
`grep -rl "getExamplePrompts('<name>')" src/tests/scenarios`, since files are per-tool only where
one tool warranted a file. Removing a public export is **breaking**: decide on a deprecated alias
or a major bump (`.release-please-manifest.json`), and mark the PR title `!`.

## The registry is the test corpus

`examplePrompts` **is** what the scenario suites assert — no parallel list, no buffer. `AGENTS.md`
§ Scenario tests holds the per-change run table and the measured counts; two things it is worth
being blunt about:

- **Neither suite gates a PR.** `scenario-tests.yml` runs the canonical suite on **push to `main`**
  — after merge — and **nothing runs the fanout at all**. A regression you don't catch locally
  lands on `main`.
- Both make **real model calls against every model in `AZURE_MODEL_IDS`** and pass only when all
  do, so cost scales with that list, not the test count.

From the root, `pnpm agent-tool-calling-test:agent-toolkit` is the canonical suite and
`pnpm -F @tomtom-org/maps-sdk-plugin-agent-toolkit test:agent-tool-calling:full` the fanout — run
the fanout before touching any `description`, `classificationPrompt` or `examplePrompts`. For the
sandbox (`tools/shared/sandbox/` and its siblings `sandbox-code.ts`, `sandbox-replay.ts`), run
`pnpm e2e-test:agent-toolkit:sandbox` (real Chromium; `pnpm test:e2e:install` once). Touched the
worker-libs path? `AGENTS.md` § Worker libs carries the two `dist/` sizes to check after
`pnpm build` — the main bundle must not jump by the size of a library.

## Finishing

Every public-surface change moves all three docs surfaces in the same PR — the consumer skill doc
plus its trigger keywords, the customer guides, and `navigation.yml` for a new page. Walk the
matrix in `AGENTS.md` § Keeping docs and the SDK skill in sync, then run
`/tomtom-maps-sdk-js-preflight`.
