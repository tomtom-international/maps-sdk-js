---
name: tomtom-maps-sdk-js-example-authoring
description: CONTRIBUTOR skill (editing this monorepo, not building an app with the SDK). Author, run and test an example app under examples/ in the Maps SDK monorepo — the required file set for a web or Node.js example, page.mdx frontmatter and its closed tag vocabulary, the page body copy the portal renders under the live demo, the build-time env allowlist, running via Vite or the Sandpack preview, and the snapshot/thumbnail workflow (which builds must precede which test, which of the three snapshot artifacts is regenerated where). Use when adding a new example, editing an existing one, writing or refreshing the prose on its docs-portal page, updating a snapshot or thumbnail, or when an example renders a blank map or its e2e test fails.
---

Examples are **SDK consumers**: standalone Vite apps importing from
`@tomtom-org/maps-sdk/{core,services,map}` exactly as a customer would. Load
**`tomtom-maps-sdk-js`** for the API itself, and import SDK constants and types (style IDs, layer
IDs, config types) from the package rather than re-deriving them.

Canonical file contents: [`examples/AGENTS.md`](../../../examples/AGENTS.md). This skill is the
*procedure*.

## Anatomy

```
my-example/
├── src/{index.html,index.ts,style.css,config.ts}
├── content/{page.mdx,thumbnail.png}
├── e2e-tests/sanity.test.ts + snapshots/
├── sandpack.ts             # required; `export const sandpackOptions = {}` is fine
├── playwright.config.ts    # export default buildPlaywrightConfig();
├── tsconfig.json           # { "extends": "../tsconfig.json" }
└── package.json
```

A **Node.js example** (`nodejs-` prefix, no map) drops `index.html`, `style.css`, `e2e-tests/` and
`playwright.config.ts`, and needs only `develop` + `develop:sandpack` scripts. It still ships
`content/`, `sandpack.ts` and `config.ts` — and with no snapshot to resize,
`generate-thumbnails.sh` skips it, so its thumbnail is authored by hand.

Non-obvious requirements:

- **`src/config.ts` is mandatory in every example**, web and Node: `export const API_KEY =
  process.env.API_KEY_EXAMPLES;`. Beyond key hygiene it's the anchor the Sandpack demos-proxy
  bootstrap injects itself next to — without one that injection breaks (`sandpackUtils.ts` logs
  and skips).
- **The map container id is `sdk-map`**, not `map`; `style.css` positions it full-screen.
- **`TomTomConfig.instance.put({ apiKey: API_KEY })` is the first SDK call.**
- **`sandpack.ts` is required even when empty.** `sandpackPriorityFiles` (ordered VFS path
  prefixes, trailing `/` for a folder) floats files a reader should see first.
- **Copy `package.json` scripts from `examples/default-map`** — `build`, `build:sandpack`, and the
  two test servers on 9050 (`dist/prod`) and 9051 (`dist/sandpack`).

## Creating one

```bash
cp -r examples/default-map examples/my-new-example        # or nodejs-geocode for a Node example
```

Then, in order:

1. **`package.json`** — `name` becomes `@examples/my-new-example`, plus a one-line `description`.
2. **`content/page.mdx`** frontmatter — `title`, `description`, `thumbnail: "./thumbnail.png"`,
   `tags`. **Tags are a closed vocabulary** from
   [`examples/src/constants/tags.ts`](../../../examples/src/constants/tags.ts): one type
   (`getting-started` / `customization` / `playground`), one or more features (`routing`,
   `traffic`, `places`, `ev`, `geometry`, `byod`, `map-style`, `base-map`, `user-interaction`,
   `utilities`, `plugins`, `ai`), one platform (`web` / `nodejs`). A tag outside the list silently
   fails to filter in the gallery.
3. **`src/`** — one idea, visibly demonstrated. Any chrome around the map is composed from
   `examples/src/templates/` rather than hand-written
   ([`examples/AGENTS.md` § Styling](../../../examples/AGENTS.md#styling-the-shared-templates));
   `base/tokens.css` is the import that is never optional, since it carries the `--ui-*`
   properties and the brand `@font-face` rules.
4. **`content/page.mdx` body** — the same file again, once `src/` is final: the portal prints it
   *after* the demo, so it claims what the reader has just watched. Contract and ceiling in
   [`examples/AGENTS.md` § The page.mdx body](../../../examples/AGENTS.md#the-pagemdx-body),
   drafting pass below.
5. **A new build-time env var** goes in `EXAMPLE_ENV_VARS`
   ([`examples/exampleBuildEnv.ts`](../../../examples/exampleBuildEnv.ts)). That allowlist is
   deny-by-default on purpose — it once baked the whole CI environment into public bundles — so an
   unlisted `process.env.X` is simply `undefined` in the built example.
6. **Snapshot + thumbnail** (below); both committed with the example.
7. **Catalog** — a bullet under the right heading in `examples/AGENTS.md` § Example Catalog.

## Running it

`pnpm develop` for the plain Vite app, `pnpm develop:sandpack` for the live-editor preview of the
same files; they share Vite's default port, so run one at a time
([`examples/AGENTS.md` § Development Setup](../../../examples/AGENTS.md#development-setup) for the
full setup). Examples consume `dist/`, so **`pnpm build:sdk` after every SDK source change** or the
page keeps running the previous build — the commonest reason an edit appears to do nothing.

## Writing the page body

Draft it against a running example, never from the ticket: the body claims what the reader
watches, and a claim that drifts from the code is the one defect here that no gate catches.

1. **Watch it.** With `pnpm develop` open, write the outcome in one sentence — what appears on the
   map, not which endpoint returned it. That is the lead.
2. **Walk the imports.** Read `src/index.ts` top to bottom and keep the calls the outcome depends
   on — delete one and the demo stops doing what the lead just claimed. Skip the setup every
   example repeats: `TomTomConfig`, constructing the map, wiring the container. Those are the
   bullets, in the order the code runs them. Two earn a sentence rather than a bare symbol name:
   the call that removes work the reader would otherwise write themselves, and the one whose input
   is unusual (a route handed to a search, a service response handed straight to a module).
3. **Link the calls.** For each principal call, search `documentation/docs-portal/guides/` and link
   its first mention to the narrowest section that explains it. One link per idea and no anchor
   twice in a body: a symbol whose best section is one an earlier bullet already opened stays
   plain. No link beats a link to a section that does not actually cover it.
4. **Cut against the frontmatter.** Read `description` and the body back to back and delete every
   clause that survives in both. The description sells the gallery card; the body sells the SDK.
5. **Cut against the code.** The Sandpack is directly above the body, so delete every line the
   reader gets by glancing at it: the constructor options, the panel's controls listed one by one,
   a call's parameters walked in order. What survives is what the code cannot say: what a call
   returns, what it decides for you, what it replaces.
6. **Cut the prose.** Reread with `examples/AGENTS.md` § The page.mdx body open and strip what it
   bans: every em dash and en dash, every sentence about what the example leaves out or would need
   in production, every term (inverted theme, BYOD, hexgrid) the body uses before saying what it
   is, and every borrowed context ("as in the routing example") that a reader arriving from the
   gallery does not have. Around 70 words when you stop, 100 at the outside.

Two checks before committing, and again whenever an example changes what it does: could a reader
who skipped the code name the call that carries the example, and does every sentence still hold
when the services answer differently tomorrow — no pin counts, no place names lifted from one run?

The bannable defects are greppable; run this over the examples you touched before the eye pass:

```bash
rg -n '[—–]' examples/*/content/page.mdx                      # dash as punctuation
rg -n 'this example|in production|for brevity|out of scope' examples/*/content/page.mdx
```

## Two builds, two servers, three artifacts

The part that trips everyone: a web example's e2e run is **two tagged tests**, each needing its own
build — `@prod` over `dist/prod` on port 9050, `@sandpack` over `dist/sandpack` on 9051. Playwright
starts both servers itself but builds neither, so a missing build leaves that half serving a blank
or 404 page — indistinguishable from a regression. Run all three builds, in this order:

Before it compares anything, the `@prod` test waits for the map to have **drawn**, by reading the
variance of the MapLibre canvas (`mapPaint.ts`). `networkidle` cannot stand in for that: MapLibre
fetches tiles from a web worker and Playwright does not count worker traffic towards the page being
idle. An example that draws no map at all — one that only prints a service response — has to say so
with `rendersMap: false`, because a page with no canvas is otherwise how a map that failed to load
presents itself.

```bash
pnpm -F map build
pnpm -F @examples/my-new-example build
pnpm -F @examples/my-new-example build:sandpack
cd examples/my-new-example && pnpm test:e2e     # or test:e2e:update-snapshots, test:e2e:ui
```

From the root, `pnpm e2e-test:examples:prod` / `:sandpack` run one tag across all examples, and
`pnpm e2e-test:examples:update-snapshot <name>` updates a single example's baselines. Then the
thumbnail, always second, because it is derived from the snapshot you just wrote:

```bash
pnpm generate-thumbnails:examples my-new-example      # omit the name to redo every example
```

Two things that catch people out and that nothing in the repo checks:

- `generate-thumbnails.sh` crops to 1000×500 anchored **right top**, so the left edge of the shot
  is what gets cut — worth a look before committing, especially on an example whose chrome sits
  left.
- The image is reached through the **`thumbnail: "./thumbnail.png"` frontmatter key** in
  `content/page.mdx`. Nothing compiles or tests that key, so a committed `thumbnail.png` no
  frontmatter names is simply never read.

The **third** artifact, on the examples that have their own chrome: `ui-temp-upon-load.png`, a
zero-tolerance shot of that chrome with the map hidden (`tempUiSnapshot.ts`). Its baseline is a
**Linux CI capture** and the check self-skips outside CI, so you can neither verify nor regenerate
it locally — macOS text rasterisation alone would fail it. To refresh one, let the CI e2e job fail
and take the file from its `ui-temp-baselines` artifact. It's temporary, tied to a CSS rename;
don't build on it.

## When a snapshot run looks wrong

- **Every example blank, every `@prod` test failing that the map drew nothing** — the local key
  lacks Orbis-style entitlement, not a regression. **Never** run
  `pnpm e2e-test:examples:update-all-snapshots` in that state: it overwrites every committed
  baseline (160-plus) with blank maps. Treat CI as authoritative (`gh pr checks <n>`).
- **One example differs slightly** — baselines allow `maxDiffPixelRatio: 0.15`
  (`examples/src/e2e-test-utils/sanityE2ETest.ts`), sized to absorb real map variation (traffic
  data, label reflow, SwiftShader antialiasing). A passing diff needs no new baseline; a failure
  at that tolerance is a real rendering change.
- **Test fails but nothing in the example changed** — you built one half only, or didn't rebuild
  `map` after an SDK change.
- Playwright's local reporter is `html` and prints nothing until it opens a server; pass
  `--reporter=list`.

## Finishing

`pnpm type-check:examples` and `pnpm test:examples` from the root (the latter asserts every built
example's prod bundle is in the packed tarball). Then `/tomtom-maps-sdk-js-preflight`, which covers
lint, the committed-artifact checklist and the docs surfaces — including the trap that guides embed
examples **by directory name** (`<GuideDemo demo="…" />` for a map example, `<SDKGuideLiveCodingExample
exampleDirectory="…" />` for a `nodejs-*` one), so renaming or removing one breaks a guide with no
compile error:

```bash
grep -rn 'my-new-example"' documentation/docs-portal/
```
