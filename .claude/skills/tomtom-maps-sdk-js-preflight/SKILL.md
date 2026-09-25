---
name: tomtom-maps-sdk-js-preflight
description: CONTRIBUTOR skill (editing this monorepo, not building an app with the SDK). ALWAYS run this before committing, pushing, or opening a PR in the Maps SDK monorepo — there are no git hooks here, so it is the only gate before CI. Also use it whenever the user asks to "preflight", "check", or "review my changes for consistency". It runs the Biome, build, type-check and unit-test gates CI runs, scoped to the packages you touched; audits the diff against CODING_GUIDELINES.md — duplicated helpers and types, imprecise types, verbose comments, abbreviated names; catches debug leftovers and stray files; and enforces that any public-interface change to the SDK or a plugin ships its docs-portal MDX guide and AI-skill doc updates in the same PR (plus AGENTS.md, navigation.yml, examples). For bug hunting use /code-review; for refactors use /simplify.
---

Gate the **working diff** before it becomes a commit or PR. Consistency and completeness, not bug
hunting — logic bugs are `/code-review`, refactors `/simplify`, vulnerabilities
`/security-review`. [`CODING_GUIDELINES.md`](../../../CODING_GUIDELINES.md) holds the rules; Step 4
verifies the diff against them. **There are no git hooks in this repository**, so every gate below is a CI job or
nothing — which is why `.claude/settings.json` bounces the first `git commit` of a session here.

**Fix**: Biome autofixes, generated churn, stale references after a rename, doc rows derivable from
the code, debug artifacts, Step 4. **Report**: anything needing invented intent — new prose or
guide sections, naming judgement, whether an untracked file belongs in the commit, whether a
public-API change deserves a deprecation alias.

## Step 1: Scope

`documentation/docs-portal/api-reference/` is committed but typedoc-generated; only the release
PR's bot commit updates it. If the diff touches it, `git checkout --` it and change the JSDoc
behind it instead. Stage explicit paths afterwards, not `git add -A`.

Then `git status --short`, `git diff`, `git diff --cached` → the touched files and the **workspaces**
driving Step 2. Scope everything below to those; never audit the whole repo. Read untracked files
fully — no baseline, and the likeliest source of Step 5 problems.

## Step 2: Gates

From the repo root. **Order matters**: dependents resolve `@tomtom-org/maps-sdk/*` through
`core/dist`, `services/dist`, `map/dist`, so type-checking or testing downstream of an unbuilt
change reads stale declarations. CI's chain (`.github/actions/install-analysis-build`) is
`pnpm install --frozen-lockfile --strict-peer-dependencies` → `lint` → `build:sdk` →
`type-check:sdk`, unit suites after.

| Touched | Run |
|---|---|
| anything | `pnpm lint` |
| `core/`, `services/`, `map/`, `shared-configs/` | `pnpm build:sdk` → `type-check:sdk` → `test:sdk` |
| `plugins/**` | `pnpm build:sdk` → `type-check:plugins` → `test:plugins` |
| `examples/**` | `pnpm build:sdk` (+ `build:plugins` if the example uses one) → `type-check:examples` → `test:examples` |
| `map-integration-tests/` | `pnpm type-check:sdk` (included) — plus Step 3 |
| `agent-eval/` | `pnpm test:agent-eval` |
| `testing/*` | no root script — `pnpm -F @testing/<name> test` / `type-check` (`core-utils`, `ai-eval` have both; `agent-tool-calling`, `ai-eval-explorer` type-check only) |

Collect every failure in one pass rather than stopping at the first, and attribute each to
`biome` / `tsc` / `vitest` so the user knows what CI blocks on.

**Judge every gate by its exit code.** Run it, then read `$?` — or run it without piping and read
the tool's own summary line (`Found N errors`, `error TSxxxx`, `Test Files N failed`). Never
conclude a gate passed from a `grep` over its output: these commands colour and wrap their
diagnostics, and pnpm prefixes them, so an anchored pattern can match nothing while the gate is
failing. A `grep` that returns zero is only evidence the pattern was wrong.

```bash
pnpm lint > /dev/null 2>&1; echo "lint exit=$?"   # 0 or it blocks CI
```

- **`pnpm lint` is `biome lint .` only** — no formatter, no `organizeImports`, so an unformatted
  file passes CI's lint job. `pnpm lint:fix` writes all three.
- **`pnpm lint:fix` leaves error-level findings behind.** It is
  `biome check . --write && biome lint . --write`, and neither pass applies a fix Biome considers
  unsafe — `noUnusedImports` among them. It prints `No fixes applied` and still exits non-zero, so
  a refactor that strips the last use of an import needs the import removed **by hand**. This is the
  commonest way a red `lint` job reaches CI.
- **Warn-level rules never fail, so CI never shows them**: `noExcessiveCognitiveComplexity`
  (max 25), `noExcessiveLinesPerFunction` (max 50), `noExplicitAny`,
  `useConsistentTypeDefinitions`, `noUnusedVariables`, `noNonNullAssertion`, `useAsConstAssertion`,
  `noInferrableTypes`. Warnings **on touched files** are findings; ignore pre-existing ones.
  `noExplicitAny`, `noExcessiveLinesPerFunction` and `useConsistentTypeDefinitions` each carry a
  repository-wide backlog, so read their counts per file and never as a total. `noUnusedImports`, by
  contrast, is **error**-level: unlike its `noUnusedVariables` neighbour it blocks the build.
- **`pnpm test:sdk` includes the live-API `*Integration.test.ts` files** under `services/`, so it
  needs a key and spends quota. Fix the code if a test encodes intended behaviour; if the change
  intentionally alters behaviour, update the test and say so.
- **Changed `package.json`** needs a matching `pnpm-lock.yaml` — CI's `--frozen-lockfile` fails
  *every* job before running any code. A version shared by two workspaces belongs in `catalog:`
  (`pnpm-workspace.yaml`); `--strict-peer-dependencies` makes an unmet peer a hard failure. A new
  runtime dependency in `core`/`services`/`map` moves the bundle, and `monitor-bundle-size.yml`
  comments the delta — note it in the report.

## Step 3: Expensive suites — run, or leave to CI

**`pnpm e2e-test:sdk`** when the diff touches map module public behaviour (event payloads, `events`
surfaces, source/layer IDs, module wiring, style-change restoration): ~160 tests in under three
minutes, the cheapest way to catch a shape change CI finds twenty minutes later. The page loads
`core/dist` (aliased in `map-integration-tests/vite.config.ts`) and `map/dist` (through the
workspace export), so **`pnpm build:sdk` first** or the browser runs the previous build. The key
self-loads from `shared-configs/.env*` outside CI. Pass `--reporter=list` (the local default `html`
prints nothing until it opens a server); `@flaky` tests need `INCLUDE_FLAKY=1`.

**`pnpm e2e-test:map-effects`** when the diff touches `plugins/map-effects/`: the visual suite over a
synthetic map, no key and no build, about ten seconds. A new effect or knob without a measured case
there is a Step 6 finding — `plugins/map-effects/AGENTS.md` makes it part of done.

**Example E2E needs three builds** — `@prod` serves `dist/prod`, `@sandpack` serves
`dist/sandpack`, neither from a dev server: `pnpm -F map build`, `pnpm -F @examples/<name> build`
**and** `… build:sandpack`, else a half serves stale or missing assets. Same before
`pnpm e2e-test:examples:update-snapshot <name>` and `generate-thumbnails:examples <name>`.
`tomtom-maps-sdk-js-example-authoring` carries the workflow and the blank-map diagnosis — including
that **`update-all-snapshots` must never run against a dead key**, since it overwrites every
committed baseline with blank maps.

**Agent-toolkit scenario tests** are LLM-in-the-loop with real model cost, and `pnpm test:plugins`
excludes them (`--exclude '**/tests/scenarios/**'`):

- `pnpm agent-tool-calling-test:agent-toolkit` — the canonical suite. `scenario-tests.yml` runs it
  on **push to `main`**, after merge, so it never gates the PR. Every scenario runs against each
  model in `AZURE_MODEL_IDS`, so cost scales with that list.
- `pnpm -F @tomtom-org/maps-sdk-plugin-agent-toolkit test:agent-tool-calling:full` — the registry
  fanout. **No CI job runs it.** Required when the diff touches a tool's `description`,
  `classificationPrompt` or `examplePrompts`; editing `examplePrompts[0]` also changes what the
  canonical suite asserts.
- `pnpm e2e-test:agent-toolkit:sandbox` — Playwright over the code-execution sandbox.

Name whatever you skip in the report, with the CI job covering it.

## Step 4: The coding guidelines

[`CODING_GUIDELINES.md`](../../../CODING_GUIDELINES.md) is the rule set; this step verifies the diff
against it, on **changed lines only**. Do not restate the rules in the report — cite the section.
Four of the nine sections need active searching rather than reading; the rest you catch by reading
the diff.

**§ 1 Reuse** — the commonest and costliest slip, because nothing flags it. For every new function,
type, constant or literal block in the diff:

- `git grep` a distinctive token from it across the repo. A hit outside the diff is a finding: name
  both locations and which one should survive.
- New geometry / bbox / distance / formatting / unit helper → confirm `core/src/util/` has no
  equivalent. New map-style layer ID literal → confirm it is not already in
  `map/src/shared/layers/layerIDs.ts`.
- A helper now used by two packages belongs in `core/src/util/`, not copied into both.
- Duplicated **data** counts: layer-ID lists, style-key tables, unit factors, category maps.
- Sonar's copy-paste detector decorates the PR without blocking, and skips `**/*.test.ts`,
  `**/*.data.ts` and `**/vite.config.ts` — so this is inspection, not a gate.
- Hand a large extraction to `/simplify` rather than doing it unasked.

**§ 2 Types** — `tsc` proves the code compiles, never that the type says what is possible:

- Two or more optional properties on one new or changed type → can they legally coexist? If not,
  it should be a discriminated union. Same for a property that is mandatory only in some mode.
- `git diff -U0 | rg 'as [A-Z]'` on the diff → each `as` either narrows instead or justifies
  itself. The `any` and `!` cases are Biome's, under `noExplicitAny` and `noNonNullAssertion`.
- A new type that restates an existing one or a Zod schema → derive it (`Pick`, `Omit`, `z.infer`).
- New `string` / `number` parameter with a known value set → literal union.

**§ 3 Comments and docs** — read every comment, TSDoc block and guide paragraph the diff adds.
Flag one that narrates the next line, runs past three lines, repeats the parameter name in
`@param`, or carries history rather than the end state ("no longer", "was renamed", "used to").
Then `git grep` a distinctive phrase from each new explanation: a concept spelled out at several
call sites belongs at the definition that owns it, with the call sites pointing there.

**§ 5 Naming** — `rg -n '\b(res|req|err|params|idx|el|ref|arg|dest|src|msg|prev|curr)\b'`
over the changed files; loop counters and `config` are the sanctioned exceptions.

Everything else — arrow functions, the blank line after a single-line `if`, `[longitude, latitude]`
order, `tests/` placement, no re-exports — is a read of the diff against §§ 4, 6, 7 and 8.

## Step 5: Strays and debug leftovers

- **Untracked files** — for each `??`, does it belong here? A throwaway live-API probe test must not
  be committed: it runs in CI and burns quota. Report; never `git add` or delete a file the user
  hasn't accounted for.
- **Debug artifacts** — `*probe*`, `*dump*`, `*scratch*`, `tmp-*`; a `.test.ts` with no `expect`; a
  test that `console.log`s a response instead of asserting.
- **Focused / disabled tests** — `it.only`, `describe.only`, `.skip`, `test.todo`. Vitest `.only`
  silently shrinks CI coverage; in `map-integration-tests`, Playwright's `forbidOnly` fails the run.
- **Leftover debugging** — `console.log`, `debugger`, commented-out blocks, a context-free `TODO`.
- **New example completeness** — `upon-load.png`, `upon-load-sandpack.png` and
  `content/thumbnail.png` committed, plus a row in the `examples/AGENTS.md` catalog. Then the four
  things nothing compiles or tests, so each one fails silently: the `thumbnail: "./thumbnail.png"`
  frontmatter key (without it the committed image is never read), a **type** tag from
  `examples/src/constants/tags.ts` alongside the feature and platform tags, a two-line
  `playwright.config.ts`, and the `test:e2e` / `start-test-server:*` scripts plus the
  `@playwright/test` devDependency in `package.json` — `diff` the four against
  `examples/default-map`. The examples-root `pnpm e2e-test:examples` sweeps every
  `e2e-tests/**/*.test.ts`, so CI stays green while `pnpm -F @examples/<name> test:e2e` cannot run
  at all.

## Step 6: Cross-surface consistency — the check nothing else performs

**A change to the public interface of the SDK or a plugin must land in the same PR as the
developer-facing documentation of that interface**: both the customer MDX guides
(`documentation/docs-portal/guides/`, 70 pages) and the AI skill docs
(`.claude/skills/tomtom-maps-sdk-js/`) that consumers' agents read. Until both move, every
developer reading a guide and every agent loading the skill is told something the code no longer
does — so treat a public-interface diff with no matching guide + skill change as **blocked**, not a
finding, unless the user said the docs land separately (which the report then states).

"Public interface" = anything a consumer can name: an export from `@tomtom-org/maps-sdk/core`,
`/services`, `/map`; a plugin's factory, options object, tool or type; a map module method or
event; a service function's parameters or returned shape; a `TomTomConfig` key; an observable
default.

| Changed | Guides | Skill docs (`.claude/skills/tomtom-maps-sdk-js/`) |
|---|---|---|
| `core/` types or utilities | `guides/core/**` | `docs/core-types.md`, `docs/core-utilities.md` |
| a `services/` function, its parameters or response | `guides/services/**` | `docs/places.md`, `docs/routing.md`, `docs/traffic.md`, `docs/services-config.md` |
| a map module's API, events or config | `guides/map/**` (a page per module) | `docs/map-setup.md`, `docs/map-styles.md`, `docs/user-events.md`, `docs/module-events.md`, `docs/custom.md`, `docs/maplibre.md` |
| `plugins/agent-toolkit/` | `guides/plugins/agent-toolkit/*.mdx` (10 pages) | `docs/agent-toolkit.md` + `docs/agent-toolkit/*.md` |
| `plugins/viewport-places/`, `plugins/landmarks-3d/`, `plugins/map-effects/` | `guides/plugins/viewport-places.mdx`, `guides/plugins/landmarks-3d.mdx`, `guides/plugins/map-effects.mdx` | `docs/places.md`, `docs/landmarks-3d.md`, `docs/map-effects.md` |

A **new** page or doc must reach its registry too: `navigation.yml` for guides; the
`Topic → Filename` table plus the `description:` keyword list for the skill.

Start every rename or removal with `git grep -l '<oldName>'` from the root, then walk:

1. **The package's own `src/**`** — barrels, registries, schemas, tests, mocks, fixtures.
2. **`AGENTS.md` of every touched directory** (`git ls-files '*AGENTS.md'` lists all 12). Their
   command lists, module tables and "Important Notes" describe *behaviour*: fix a sentence the diff
   falsified, report one needing new explanation. A new top-level workspace needs a row in the root
   tables.
3. **Every guide and skill doc naming the symbol**, not just the feature's owner. Two traps: guides
   embed examples **by directory name** (`<GuideDemo demo="…" />`, or `<SDKGuideLiveCodingExample
   exampleDirectory="…" />` for a `nodejs-*` one), so renaming an example breaks a guide with no
   compile error — `grep -rn '<name>"' documentation/docs-portal/` first; and in
   the consumer skill a new API name must reach the `Topic → Filename` **keyword column** and the
   `description:` **keyword list**, or the skill stops auto-loading on that name.
4. **`tomtom-maps-sdk-js-contribution` and this skill** — when a *command*, *convention* or
   *workflow* changed, not for ordinary API changes. A skill **directory name** is a public install
   identifier, so adding or renaming one must also reach the guides enumerating the family.
5. **`examples/**`** — they compile against the public API, so a renamed export breaks them and a
   new capability usually deserves one. `pnpm type-check:examples` covers the compile half; the
   report says whether a new example is warranted.

Package extras stack on top: the agent-toolkit has per-change wiring checklists and its own
three-surface docs matrix, which `tomtom-maps-sdk-js-agent-toolkit-internals` walks. Follow any
"after adding X, also touch Y" rule in a touched package's `AGENTS.md`.

Release surface:

- **Changed a public type shape** — make the JSDoc `@typeParam` / property docs match the real
  signature (a JSDoc contradicting the code is the commonest automated-review nag here) and decide
  whether consumers need a deprecated alias.
- **Breaking public API** — the PR **title** carries the conventional-commit `!` (`feat(map)!: …`).
  `commisery.yml` validates the title, not the commits, because the repo squash-merges, and it
  caps the title at **80 characters** — the one failure with nothing to do with the code. The PR's
  changeset carries the bump: `minor` pre-1.0.
- **Added external-resource fetching** — confirm bounded handling: protocol allowlist,
  `AbortController` timeout, streamed size cap. `new URL()` alone is not validation.

## Step 7: Report

Lead with the verdict — **ready to push** or **blocked**, and by what. Then briefly:

- **Fixed** — what changed, grouped by kind, with paths.
- **Findings** — most important first (`path:line`, what's wrong, why it matters, suggested fix),
  grouped by the step that found them so the failing gate is obvious.
- **Docs surfaces** — for a public-interface change, the guides and skill docs updated and any
  still outstanding; if none were needed, why.
- **Not run** — every skipped suite and the CI job covering it.
- **PR title** — if a PR is next, the proposed conventional-commit title (`!` if breaking, ≤80
  characters). The **body** is `tomtom-maps-sdk-js-pr-description`, which takes this report's
  breaking-change rows as its own source; hand off rather than drafting one here. The "Not run"
  list stops with this report — CI reports what ran, so the body never restates it.

Paste failing output rather than summarising it. If a gate didn't pass, say so in the verdict —
never "ready to push" with the failure buried below.
