---
name: tomtom-maps-sdk-js-preflight
description: CONTRIBUTOR skill (editing this monorepo, not building an app with the SDK). ALWAYS run this before committing, pushing, or opening a PR in the Maps SDK monorepo — there are no git hooks here, so it is the only gate before CI. Also use it whenever the user asks to "preflight", "check", or "review my changes for consistency". It runs the Biome, build, type-check and unit-test gates CI runs, scoped to the packages you touched; catches debug leftovers and stray files; and enforces that any public-interface change to the SDK or a plugin ships its docs-portal MDX guide and AI-skill doc updates in the same PR (plus AGENTS.md, navigation.yml, examples). For bug hunting use /code-review; for refactors use /simplify.
---

Gate the **working diff** before it becomes a commit or PR. Consistency and completeness, not bug
hunting — logic bugs are `/code-review`, refactors `/simplify`, vulnerabilities
`/security-review`. Conventions live in `tomtom-maps-sdk-js-contribution`; this verifies you
followed them. **There are no git hooks in this repository**, so every gate below is a CI job or
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

- **`pnpm lint` is `biome lint .` only** — no formatter, no `organizeImports`, so an unformatted
  file passes CI's lint job. `pnpm lint:fix` writes all three.
- **Warn-level rules never fail, so CI never shows them**: `noExcessiveCognitiveComplexity`
  (max 25), `noUnusedVariables`, `noNonNullAssertion`, `useAsConstAssertion`, `noInferrableTypes`.
  Warnings **on touched files** are findings; ignore pre-existing ones.
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

## Step 4: Conventions Biome cannot enforce

The full list is root [`AGENTS.md`](../../../AGENTS.md) § Conventions & Patterns plus the
package-level files. **Changed lines only**, and only what has no automated backstop — these are
the ones that actually slip:

- **No abbreviated names** (`response` not `res`, `parameters` not `params`, `configuration` not
  `config`; full mapping in `AGENTS.md`). Loop indices excepted.
- **Blank line after a single-line `if`** when more code follows.
- **No re-exports** — import from the canonical source; a forwarding barrel is pure indirection.
- **Coordinates are `[longitude, latitude]`** (GeoJSON order).
- **Tests** go in a `tests/` subdirectory beside the source, never a sibling `*.test.ts`.
- **Reuse core utilities** — check `core/src/util/` and the package's own helpers before adding a
  geometry / bbox / distance / formatting helper. A duplicated helper is the commonest slip here.
- **No spaghetti** — a function both >~50 lines *and* deeply nested gets its nested blocks
  extracted into named helpers.
- **Never import `map` from `services` or vice versa** — compiles locally, breaks the published
  packages.

## Step 5: Strays, debug leftovers, duplication

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
- **Duplication** — Sonar's copy-paste detector decorates the PR without blocking and skips
  `**/*.test.ts`, `**/*.data.ts`, `**/vite.config.ts`, so judge by inspection: `git grep` a
  distinctive line from every new function or block over ~10 lines. Duplicated *data* counts too —
  layer-ID lists, style-key tables, unit constants restating `core/src/util/`. Report both
  locations with a suggestion; hand a large extraction to `/simplify` rather than doing it unasked.

## Step 6: Cross-surface consistency — the check nothing else performs

**A change to the public interface of the SDK or a plugin must land in the same PR as the
developer-facing documentation of that interface**: both the customer MDX guides
(`documentation/docs-portal/guides/`, 68 pages) and the AI skill docs
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
| `plugins/viewport-places/`, `plugins/landmarks-3d/` | `guides/plugins/viewport-places.mdx`, `guides/plugins/landmarks-3d.mdx` | `docs/places.md`, `docs/landmarks-3d.md` |

A **new** page or doc must reach its registry too: `navigation.yml` for guides; the
`Topic → Filename` table plus the `description:` keyword list for the skill.

Start every rename or removal with `git grep -l '<oldName>'` from the root, then walk:

1. **The package's own `src/**`** — barrels, registries, schemas, tests, mocks, fixtures.
2. **`AGENTS.md` of every touched directory** (`git ls-files '*AGENTS.md'` lists all 11). Their
   command lists, module tables and "Important Notes" describe *behaviour*: fix a sentence the diff
   falsified, report one needing new explanation. A new top-level workspace needs a row in the root
   tables.
3. **Every guide and skill doc naming the symbol**, not just the feature's owner. Two traps: guides
   embed examples **by directory name** (`<SDKGuideLiveCodingExample exampleDirectory="…" />`), so
   renaming an example breaks a guide with no compile error — `grep -rn
   'exampleDirectory="<name>"' documentation/docs-portal/` first; and in the consumer skill a new
   API name must reach the `Topic → Filename` **keyword column** and the `description:`
   **keyword list**, or the skill stops auto-loading on that name.
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
  caps the title at **80 characters** — the one failure with nothing to do with the code. Check
  `.release-please-manifest.json` for a coordinated bump.
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
