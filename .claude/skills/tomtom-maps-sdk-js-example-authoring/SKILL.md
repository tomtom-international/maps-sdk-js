---
name: tomtom-maps-sdk-js-example-authoring
description: CONTRIBUTOR skill (editing this monorepo, not building an app with the SDK). Author, run and test an example app under examples/ in the Maps SDK monorepo — the required file set for a web or Node.js example, page.mdx frontmatter and its closed tag vocabulary, the build-time env allowlist, running via Vite or the Sandpack preview, and the snapshot/thumbnail workflow (which builds must precede which test, which of the three snapshot artifacts is regenerated where). Use when adding a new example, editing an existing one, updating a snapshot or thumbnail, or when an example renders a blank map or its e2e test fails.
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
3. **`src/`** — one idea, visibly demonstrated.
4. **A new build-time env var** goes in `EXAMPLE_ENV_VARS`
   ([`examples/exampleBuildEnv.ts`](../../../examples/exampleBuildEnv.ts)). That allowlist is
   deny-by-default on purpose — it once baked the whole CI environment into public bundles — so an
   unlisted `process.env.X` is simply `undefined` in the built example.
5. **Snapshot + thumbnail** (below); both committed with the example.
6. **Catalog** — a bullet under the right heading in `examples/AGENTS.md` § Example Catalog.

## Running it

```bash
pnpm build:sdk                       # examples resolve the SDK through core/services/map dist
cd examples/my-new-example
pnpm develop                         # plain Vite app; open the URL Vite prints
pnpm develop:sandpack                # the Sandpack live-editor preview of the same files
```

Both take Vite's default port, so run one at a time. `examples/.env` supplies `API_KEY_EXAMPLES`.
After changing SDK source, rebuild it — examples consume `dist/`.

## Two builds, two servers, two snapshots

The part that trips everyone: a web example's e2e run has **two tagged tests**, each needing its
own build.

| Test tag | Served from | Port | Snapshot |
|---|---|---|---|
| `@prod` | `dist/prod` (`pnpm build`) | 9050 | `upon-load.png` |
| `@sandpack` | `dist/sandpack` (`pnpm build:sandpack`) | 9051 | `upon-load-sandpack.png` |

Playwright starts both servers itself but builds neither, so a missing build leaves that half
serving a blank or 404 page — indistinguishable from a regression.

```bash
pnpm -F map build
pnpm -F @examples/my-new-example build
pnpm -F @examples/my-new-example build:sandpack
cd examples/my-new-example && pnpm test:e2e     # or test:e2e:update-snapshots, test:e2e:ui
```

From the root, `pnpm e2e-test:examples:prod` / `:sandpack` run one tag across all examples, and
`pnpm e2e-test:examples:update-snapshot <name>` updates a single example's baselines.

A **third** artifact exists on the 42 examples that have their own chrome:
`ui-temp-upon-load.png`, a zero-tolerance shot of that chrome with the map hidden
(`tempUiSnapshot.ts`). Its baseline is a **Linux CI capture** and the check self-skips outside CI,
so you can neither verify nor regenerate it locally — macOS text rasterisation alone would fail it.
To refresh one, let the CI e2e job fail and take the file from its `ui-temp-baselines` artifact.
It's temporary, tied to a CSS rename; don't build on it.

## Thumbnails

`content/thumbnail.png` is **derived from `upon-load.png`** —
`examples/scripts/generate-thumbnails.sh` resizes it to 1000×500 (`fit: cover`, anchored right top)
with sharp. Always snapshot first, thumbnail second, and commit both; a thumbnail regenerated from
a stale snapshot is the usual cause of a gallery image that doesn't match the example.

The file alone is not enough: the gallery reaches it through the **`thumbnail: "./thumbnail.png"`
frontmatter key** in `content/page.mdx`. Nothing in the repo compiles or tests that key, so a
committed `thumbnail.png` that no frontmatter names is simply never read. Add the key with the
rest of the frontmatter, not with the image.

```bash
pnpm e2e-test:examples:update-snapshot my-new-example
pnpm generate-thumbnails:examples my-new-example      # omit the name to redo every example
```

## When a snapshot run looks wrong

- **Every example blank, all snapshots failing at the 60s timeout** — the local key lacks
  Orbis-style entitlement, not a regression. **Never** run
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
examples **by directory name** (`<SDKGuideLiveCodingExample exampleDirectory="…" />`), so renaming
or removing one breaks a guide with no compile error:

```bash
grep -rn 'exampleDirectory="my-new-example"' documentation/docs-portal/
```
