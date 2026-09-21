---
name: tomtom-maps-sdk-js-contribution
description: Orient to the SDK contributor context. Use when a contributor asks how to work on, build, or modify the TomTom Maps SDK — or when the current task involves editing SDK source files in core/, map/, services/, plugins/, examples/, or map-integration-tests/.
allowed-tools: Read, Glob
---

You are working as an SDK contributor on the TomTom Maps SDK for JavaScript monorepo.

`AGENTS.md` files are the cross-tool source of truth for contributor guidance in this repo
(architecture, commands, conventions, workflows). This skill routes you to them — **it does not
restate them.**

## Orientation steps

1. **Always** read the root `AGENTS.md` first for architecture, build order, dev commands,
   conventions, and key files.

2. Read the package-specific `AGENTS.md` for the area you're touching:

   | If the task touches… | Read |
   |---|---|
   | `core/` | `core/AGENTS.md` |
   | `map/` | `map/AGENTS.md` |
   | `services/` | `services/AGENTS.md` |
   | `examples/` | `examples/AGENTS.md` — for authoring, snapshot, thumbnail or e2e work use `tomtom-maps-sdk-js-example-authoring` |
   | `map-integration-tests/` | `map-integration-tests/AGENTS.md` |
   | `plugins/` (any) | `plugins/AGENTS.md` |
   | `plugins/agent-toolkit/` | `plugins/agent-toolkit/AGENTS.md` + `ENGINEERING-GUIDELINES.md` |
   | `plugins/viewport-places/` | `plugins/AGENTS.md` (no dedicated file; see `src/viewportPlaces.ts`) |
   | `plugins/landmarks-3d/` | `plugins/AGENTS.md` (no dedicated file; see `src/Landmarks3D.ts`) |
   | `shared-configs/` | `shared-configs/AGENTS.md` |
   | `documentation/` | `documentation/AGENTS.md` |
   | `documentation/docs-portal/` | `documentation/docs-portal/AGENTS.md` (guide writing with `SDKGuideLiveCodingExample`) |

   If the area is unclear, read all package-level `AGENTS.md` files before acting.

3. The conventions with **no automated backstop** — Biome and `tsc` catch the rest, so these are
   the ones to hold in mind while writing:

   - **Coordinates**: always `[longitude, latitude]` (GeoJSON order).
   - **Full variable names** — `response` not `res`, `parameters` not `params`, `configuration`
     not `config` (full list in root `AGENTS.md`).
   - **Blank line after a single-line `if`** when more code follows.
   - **No re-exports** — import from the canonical source, never barrel-forward.
   - **Tests** go in a `tests/` subdirectory beside the source, never a sibling `*.test.ts`.
   - **Tool `execute`** in plugins catches and returns `{ error: string }`, never throws.
   - **Never import `map` from `services` or vice versa** — it compiles locally and breaks the
     published packages.

## After editing source

`pnpm lint:fix` from the root — it runs `biome check --write` (format, lint and import ordering)
followed by `biome lint --write`. Fix the errors it reports; warnings about pre-existing complexity
or non-null assertions in files you didn't touch are not yours.

## Before committing or pushing

Run **`/tomtom-maps-sdk-js-preflight`**. There are no git hooks in this repository, so it is the
only gate before CI: it runs the gates CI runs — scoped to the workspaces you touched, in the order
that avoids stale `dist/` declarations — then checks the surfaces that go stale silently
(`AGENTS.md`, the docs-portal guides plus `navigation.yml`, both `.claude/skills/` trees, the
examples' snapshot and thumbnail artifacts), and knows which expensive suites are worth running
locally. It also carries the full cross-file consistency sweep for a rename, a changed public type
shape, or new external-resource fetching. `.claude/settings.json` bounces the first `git commit` of
a session so it actually runs.

**A change to the public interface of the SDK or of a plugin is not finished until the
developer-facing docs move with it, in the same PR**: the MDX guide under
`documentation/docs-portal/guides/` and the AI skill document under
`.claude/skills/tomtom-maps-sdk-js/docs/` (plus that skill's `Topic → Filename` keyword column and
`description:` keyword list, or the new name won't trigger it). The preflight skill carries the
per-area mapping of which guide and which doc.

## The skill family

All SDK skills share the `tomtom-maps-sdk-js` prefix, and split two ways — by **audience**, and by
whether a skill *routes* or *walks a procedure*:

|  | Router — which rules apply here? | Task — do these steps, in this order |
|---|---|---|
| **Consumer** (building an app *with* the SDK) | `tomtom-maps-sdk-js` — topic → reference doc. The published skill: customers install it with `npx skills add`. | — |
| **Contributor** (editing *this* monorepo) | `tomtom-maps-sdk-js-contribution` — **this skill**: area → `AGENTS.md` | `-preflight`, `-pr-description`, `-example-authoring`, `-agent-toolkit-internals` |

This skill is a router, not a parent — **the namespace is flat, and that is deliberate.** The
consumer skill nests, with nineteen reference docs under `docs/`, because those docs are *read* by one
skill mid-answer: they are never invoked on their own and never need a tool the parent lacks. A
contributor task skill is the opposite on both counts. It fires on **its own `description`**, which a
`docs/` file cannot have — nesting `-preflight` would mean the parent's description had to enumerate
every trigger of every child, and the parent would have to load first. And `allowed-tools` is
inherited from the active skill, so a procedure nested under this router's `Read, Glob` could not run
`pnpm lint` at all.

Hence the rule: a **procedure** that is invoked or auto-triggered on its own is a sibling directory;
**reference material** read only from inside one procedure goes under that skill's own `docs/`.
Nesting is a per-skill decision, not a family-wide layout. A new task skill belongs here only when it
encodes an *order of operations* — everything else belongs in an `AGENTS.md`, where non-Claude tools
read it too.

Branch off when:

- Verifying a finished change before commit / push / PR → **`/tomtom-maps-sdk-js-preflight`**.
- Writing, rewriting or compacting a PR title and body — the ≤80-character conventional commit
  title, the `Problem Statement` → `Solution Overview` → diff-walk → `Caveats` section order,
  keeping it compact and technical — bullets rather than paragraphs, a size ceiling per section,
  the detail in the diff sections — links to the Jira key, the wiki pages and every named file's
  own PR diff, and where a diagram goes →
  **`tomtom-maps-sdk-js-pr-description`**.
- Adding or editing an example under `examples/`, or updating a snapshot or thumbnail →
  **`tomtom-maps-sdk-js-example-authoring`** (examples are SDK *consumers*; it also covers the
  two-build/two-snapshot e2e workflow).
- Touching `plugins/agent-toolkit/` source — a tool, a state slice, a prompt, the classifier, the
  sandbox → **`tomtom-maps-sdk-js-agent-toolkit-internals`**, which carries the "every slice"
  wiring paths and which scenario suite each change obliges you to run. `ENGINEERING-GUIDELINES.md`
  remains required reading. (*Using* the toolkit to build an agent is the consumer skill's
  `agent-toolkit` doc instead.)
- Building an SDK *consumer* app, not editing SDK source → **`tomtom-maps-sdk-js`**.
- Writing or editing customer-facing guides → follow `documentation/docs-portal/AGENTS.md`.

Every one of these is public: `.claude/skills/**` syncs to the read-only GitHub mirror, so a skill
directory name is an install identifier someone outside TomTom can resolve. Hence the shared prefix
and the `CONTRIBUTOR skill` opener on each contributor description — renaming one is a
public-surface change, so sweep it like any other.

`copy.bara.sky` excludes three things under `.claude/`: `settings.json`, `hooks/**`, and
`skills/tomtom-maps-sdk-js-feedback/**`. The feedback skill is an internal trial — it posts to
`tomtom-international/maps-sdk-js`, so no public surface (the consumer skill, the docs-portal guides, the
README) may reference it by name. To try it against a consumer project, install it by hand:

```bash
cp -R .claude/skills/tomtom-maps-sdk-js-feedback ~/.claude/skills/
```
