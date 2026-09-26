# AGENTS.md - Examples

**Live examples demonstrating SDK features** — each a standalone Vite app, published to the docs portal.

## For External Developers (Using the SDK)

**👉 If you're a customer/user of the SDK:**

- **[View Live Examples](https://docs.tomtom.com/maps-sdk-js/examples/)** - Interactive examples you can test online
- **[Official Documentation](https://docs.tomtom.com/maps-sdk-js/)** - Complete SDK documentation
- **[Example Catalog](#example-catalog)** - See list of all available examples below

**Do not** use code from this repository directly - examples here are for SDK development. For production code, follow the official documentation above.

---

## For Contributors (Developing Examples)

This section is for developers working on the SDK examples codebase.

### Orientation: examples are SDK consumers

Each example is a small **app built on top of the SDK** — examples import from
`@tomtom-org/maps-sdk/{core,services,map}` exactly as a customer would. When
you're adding or editing an example, you're writing consumer code, not editing
SDK source.

If you have access to skills, **invoke the `tomtom-maps-sdk-js` skill** before
writing example code. It is the canonical reference for the consumer-facing API
(`TomTomMap`, modules, `setStyle`, `standardStyleIDs`, events, services, etc.)
and will steer you away from internal helpers that aren't part of the public
surface. The contributor-mode skill (`tomtom-maps-sdk-js-contribution`) is for
editing `core/`, `services/`, `map/`, or plugins — not for example apps. For the
example workflow itself, use `tomtom-maps-sdk-js-example-authoring`.

When an example needs an SDK constant or type (style IDs, layer IDs, config
types, etc.), import it from `@tomtom-org/maps-sdk/...` rather than hardcoding
or re-deriving it locally.

### Development Setup

```bash
# From the repo root
pnpm install
pnpm build:sdk                  # examples resolve the SDK through core/services/map dist
cp examples/.env.example examples/.env   # then set API_KEY_EXAMPLES

cd examples/<example-name>
pnpm develop                    # plain Vite app, on Vite's default port
pnpm develop:sandpack           # the Sandpack live-editor preview of the same files
```

Both dev servers take the same port, so run one at a time. Examples call the
real TomTom APIs and spend quota. A few need more than the one key —
`examples/.env.example` documents each extra (Azure for the agent examples, the
Move Portal key for traffic area analytics). [`../CONTRIBUTING.md`](../CONTRIBUTING.md)
covers the wider repo setup.

### Minimum Ingredients — Web Example

A web example (browser, renders a map) requires exactly:

```
my-example/
├── src/
│   ├── index.html      # HTML shell with #sdk-map div
│   ├── index.ts        # SDK code: TomTomConfig + TomTomMap (imports config + style.css)
│   ├── style.css       # Full-screen #sdk-map positioning
│   └── config.ts       # export const API_KEY = process.env.API_KEY_EXAMPLES;
├── content/
│   ├── page.mdx        # Frontmatter: title, description, thumbnail, tags (+ optional hideExample/hideDemo/noIndex)
│   └── thumbnail.png   # Screenshot of the example
├── e2e-tests/
│   ├── sanity.test.ts  # Calls sanityE2ETest({ page, testInfo })
│   └── snapshots/
│       └── upon-load.png  # Playwright snapshot (commit after generating)
├── sandpack.ts         # Required (can be empty: export const sandpackOptions = {})
├── package.json        # See required scripts below
├── playwright.config.ts  # One line: export default buildPlaywrightConfig();
└── tsconfig.json       # One line: { "extends": "../tsconfig.json" }
```

**`content/page.mdx`** — frontmatter, then a short body. The portal builds the
gallery card from the frontmatter and renders the body on the example's own
page:

```mdx
---
title: "My example"
thumbnail: "./thumbnail.png"
description: "One-line gallery blurb"
tags:
    - getting-started
    - web
---

What the reader just watched, then the calls that did it — see
[The page.mdx body](#the-pagemdx-body).
```

`tags` must use ids declared in [`src/constants/tags.ts`](./src/constants/tags.ts).

Two optional visibility flags control where the portal publishes the example
(omitted = visible everywhere):

- `hideExample: true` — no gallery card and no sandbox page
  (`/maps-sdk-js/examples/<name>`); the fullscreen demo (`/demos/<name>`) still
  deploys if the example ships a prod build. Use for demo-only examples such as
  `claim-validation-service`.
- `hideDemo: true` — no fullscreen `/demos/<name>` page even when a prod build
  ships; the gallery card and sandbox page are unaffected.

A third flag controls search engines rather than publication:

- `noIndex: true` — every page the example still publishes is built and linked
  as usual, but each carries a `noindex, nofollow` robots tag and is left out of
  the portal's sitemap. It applies to whichever pages the two flags above leave
  in place. Use it to withdraw an example from search without unpublishing it.

**`src/index.html`** — minimal shell (lowercase `doctype`; Biome's formatter rewrites the
uppercase form):
```html
<!doctype html>
<html lang="en">
    <head>
        <title>My Example</title>
        <meta name="viewport" content="initial-scale=1,maximum-scale=1,user-scalable=no">
        <link rel="icon" href="data:,">
    </head>
    <body>
        <div id="sdk-map"></div>
        <script type="module" src="./index.ts"></script>
    </body>
</html>
```

**`src/index.ts`** — minimal entry point:
```typescript
import { TomTomConfig } from '@tomtom-org/maps-sdk/core';
import { TomTomMap } from '@tomtom-org/maps-sdk/map';
import './style.css';
import { API_KEY } from './config';

// (Set your own API key when working in your own environment)
TomTomConfig.instance.put({ apiKey: API_KEY, language: 'en-GB' });

new TomTomMap({
    mapLibre: {
        container: 'sdk-map',
        center: [4.8156, 52.4414],
        zoom: 8,
    },
});
```

**`src/style.css`** — required for full-screen map:
```css
#sdk-map {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
}
```

**`package.json`** — required scripts for web example:
```json
{
  "name": "@examples/my-example",
  "description": "Short description",
  "type": "module",
  "scripts": {
    "build": "vite build --config ../example-vite.config.ts",
    "build:sandpack": "vite build --config ../example-sandpack-vite.config.ts",
    "clean:dist": "rimraf ./dist",
    "develop": "vite --config ../example-vite.config.ts",
    "develop:sandpack": "vite --config ../example-sandpack-vite.config.ts",
    "type-check": "tsc --noEmit",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:update-snapshots": "playwright test --update-snapshots",
    "start-test-server:prod": "vite serve dist/prod --port 9050",
    "start-test-server:sandpack": "vite preview --outDir dist/sandpack --port 9051"
  },
  "dependencies": {
    "@tomtom-org/maps-sdk": "workspace:*"
  },
  "devDependencies": {
    "@playwright/test": "catalog:",
    "@types/node": "catalog:",
    "rimraf": "catalog:",
    "rollup-plugin-visualizer": "catalog:",
    "ts-node": "catalog:",
    "typescript": "catalog:",
    "vite": "catalog:"
  }
}
```

---

### Minimum Ingredients — Node.js Example

A Node.js example (server-side, no map rendering) requires exactly:

```
my-nodejs-example/
├── src/
│   ├── index.ts        # SDK code: TomTomConfig + service call + console.log (imports config)
│   └── config.ts       # export const API_KEY = process.env.API_KEY_EXAMPLES;
├── content/
│   ├── page.mdx        # Frontmatter: same contract as web examples (include tag: nodejs)
│   └── thumbnail.png   # Screenshot or representative image
├── sandpack.ts         # Required (can be empty: export const sandpackOptions = {})
├── package.json        # See required scripts below
└── tsconfig.json       # One line: { "extends": "../tsconfig.json" }
```

No `index.html`, no `style.css`, no e2e tests.

**`src/index.ts`** — minimal entry point:
```typescript
import { TomTomConfig } from '@tomtom-org/maps-sdk/core';
import { geocode } from '@tomtom-org/maps-sdk/services';
import { API_KEY } from './config';

TomTomConfig.instance.put({ apiKey: API_KEY });

(async () => {
    const result = await geocode({ query: 'Amsterdam', limit: 3 });
    console.log(JSON.stringify(result, null, 4));
})();
```

**`package.json`** — required scripts for Node.js example:
```json
{
  "name": "@examples/nodejs-my-example",
  "description": "Short description",
  "type": "module",
  "scripts": {
    "develop": "node src/index.ts",
    "develop:sandpack": "vite --config ../example-sandpack-vite.config.ts"
  },
  "dependencies": {
    "@tomtom-org/maps-sdk": "workspace:*"
  },
  "devDependencies": {
    "typescript": "catalog:"
  }
}
```

---

### Styling: the shared templates

`examples/src/templates/` holds the UI an example's chrome is built from. Both
halves are **reference material**: copy what you need into the example, never
import the HTML or extend the CSS in place.

- **`html/`** — component snippets (panels, search panel, dropdowns, sliders,
  toggles, radio groups, colour selectors, spinner) plus `complete-example.html`
  composing them.
- **`examples/`** — whole pages under `templates/` (`minimal-example.html`,
  `complex-panel-example.html`, `form-controls-showcase.html`) to build from.
- **`css/`** — granular stylesheets by concern: `base/`, `panel/`, `button/`,
  `form/`, `feedback/`, `maplibre/`, the two `agent-*.css` shells, and
  `styles.css` importing everything.

An example's `src/style.css` `@import`s only the files it uses:

```css
@import '../../src/templates/css/base/tokens.css';
@import '../../src/templates/css/base/global.css';
@import '../../src/templates/css/base/typography.css';
@import '../../src/templates/css/panel/custom-panel.css';
```

- **`base/tokens.css` comes first and is never optional.** It declares the
  `--ui-*` custom properties every other template file reads, and it imports
  `base/fonts.css`, which carries the `@font-face` rules for Gilroy and Proxima
  Nova. An example that names a brand face without importing it renders in the
  fallback system face — so reach for `var(--ui-font-gilroy)` rather than
  spelling the family out.
- The other two `base/` files (`global.css` for the box-sizing reset, body
  defaults and `#sdk-map`; `typography.css` for headings and labels) are
  required in practice for anything with chrome.
- Import a `panel/`, `button/`, `form/`, `feedback/` or `maplibre/` file only
  when the example actually uses that component.

**Sandpack sees fully expanded CSS.** Vite resolves these `@import`s normally at
build time, but for the portal's live editor `inlineTemplateCSSImports`
(`src/sandpack/sandpackUtils.ts`) inlines them recursively, so a reader browsing
the example gets the real classes rather than an unresolvable path. The tradeoff
is that some inlined rules go unused in a given example, which is cheap next to
keeping one source of truth for shared styles.

---

### The page.mdx body

Every example page on the portal (`/maps-sdk-js/examples/<name>`) renders the
body of `content/page.mdx` in the slot **below the live demo and above "Related
examples"**. `title` and `description` are already printed above the demo, so
the reader reaches the body having watched the example run.

The body has exactly two jobs: **name what the example showcases**, and show
**how little SDK surface it took**. It is not a tutorial: no setup steps, no
API-key instructions, no parameter tables, no "in this example we will…", and no
restating the `description`.

Two readers get the same copy. A developer skims it seconds after watching the
demo, and an AI agent reads it as the prose description of what these calls do.
Both are served by the same thing: plain declarative sentences, symbols spelled
as they are exported, and claims that hold on their own.

**Shape** — around 70 words, 100 at the outside:

1. A lead of one sentence: the outcome the reader just watched.
2. Two to four bullets, one or two lines each. Each names the SDK symbol doing
   the work, and what that call spares the caller. When a guide explains that
   symbol or concept, its first mention links to the narrowest applicable guide
   section.

Past that ceiling the copy has started explaining the domain instead of the SDK,
or the example is demonstrating more than one idea.

**Rules**

- **No headings.** `##` renders at the same weight as the page's own "Related
  examples" heading, so it reads as a new page section rather than as part of
  the example.
- **No dash as punctuation.** Em dash and en dash are both out: use a comma, a
  colon, a full stop or brackets, and write a range as "Paris to Amsterdam".
  Hyphenated compounds (`along-route`, `high-power`) are unaffected.
- **Never say what the example leaves out.** No limitations, no "this example
  does not handle…", no "a production app would also…", no scope notes. Saying
  what a *call* spares its caller ("the response is already GeoJSON, so `show`
  takes it unchanged") is the opposite move, and is the point of every bullet.
- **Self-contained.** The reader arrives from a gallery card, not from another
  example: no "as in the routing example", and no SDK or domain term (inverted
  theme, BYOD, long-distance EV routing, hexgrid, geobias) used before the
  sentence around it says what it is.
- **Earn the bullet against the code.** The Sandpack sits directly above, so
  anything a reader picks up by glancing at `src/` is a wasted line: no
  restating `center` and `zoom`, no listing a panel's controls one by one, no
  walking a call's options in order. Name the call, then say what the code does
  not show: what it returns, what it decides for you, what it replaces.
- **Concrete over adjectives**: "one call", "no layer wiring", "the response is
  already GeoJSON"; never "powerful", "seamless", "effortless", "simply",
  "just".
- **Name the exported symbol**, spelled as it is exported:
  `withInsertedWaypoints`, `RoutingModule.create`, `calculateRoute`.
- **Embed guide links in the key code words**, for example
  [`withInsertedWaypoints`](/maps-sdk-js/guides/core/utilities/routes#withinsertedwaypoints),
  and prefer the section that explains the exact call over the top of its guide.
- **One link per idea, and no anchor twice.** Link a symbol on its first mention
  only, and drop a link whose best section is one this body already points at.
  Roughly one link per bullet; past four the copy reads as a link list.
- **Links are root-relative and carry no `.mdx`**:
  [`RoutingModule.showRoutes`](/maps-sdk-js/guides/map/routes#displaying-routes),
  `[TomTomMap](/maps-sdk-js/api-reference/classes/map.TomTomMap.html)`. The
  relative-link convention the guides use does not apply here: an example page's
  URL sits under `/maps-sdk-js/examples/`, nowhere near this file on disk.
- Do not manufacture a link when no guide section explains the call. The API
  reference remains the fallback for a symbol with no guide coverage.

Node.js examples follow the same contract; their demo is console output rather
than a map.

**Worked example** — `add-stops-to-route`:

```mdx
Two waypoints go in, a route comes back, and the chargers beside it join it as extra stops, in
along-route order, on a single recalculation.

- [`search`](/maps-sdk-js/guides/services/places/search#along-route-search) takes the route
  itself as an input, so "along this route, within this detour" is a query rather than a
  post-filter.
- [`withInsertedWaypoints`](/maps-sdk-js/guides/core/utilities/routes#withinsertedwaypoints)
  projects old and new stops onto the route and orders them, so the insert positions are not
  yours to work out.
- [`RoutingModule.showRoutes`](/maps-sdk-js/guides/map/routes#displaying-routes) and
  `showWaypoints` redraw the updated journey straight from the service response, with no layer
  bookkeeping.
```

`showWaypoints` stays unlinked on purpose: it is one section away in the guide
the bullet already opened, so a second link buys the reader nothing. The words
go the same way. The second bullet lost its "once" because the lead had already
promised a single recalculation.

The `tomtom-maps-sdk-js-example-authoring` skill carries the drafting pass that
gets you there.

---

### Creating a New Example

```bash
cp -r examples/default-map examples/my-new-example        # web
cp -r examples/nodejs-geocode examples/nodejs-my-example  # Node.js
```

Copying is the supported route: an example's `package.json` scripts,
`playwright.config.ts` and `tsconfig.json` all delegate to the shared configs,
and several of those files fail silently rather than loudly when they are
missing or wrong. What the result must contain is the two "Minimum Ingredients"
sections above; the order to fill it in is the
`tomtom-maps-sdk-js-example-authoring` skill; the last step is a bullet under
the right heading in the [Example Catalog](#example-catalog) below.

### Sandpack Live Coding Preview

Sandpack provides an interactive code editor with live preview for examples. This is useful for:

- Testing examples in an isolated environment
- Providing interactive documentation
- Debugging examples with real-time code changes

**Run Sandpack preview:**

```bash
cd examples/<example-name>
pnpm develop:sandpack
# Opens a React app with Sandpack editor showing your example
```

`sandpack.ts` is **required** in every example (web and Node.js). The default empty export is fine unless you need to customize the editor:

```typescript
// my-example/sandpack.ts
import type { SandpackOptions } from '@codesandbox/sandpack-react';

export const sandpackOptions: Partial<SandpackOptions> = {
  editorHeight: '600px',
  layout: 'preview',  // or 'console'
  showLineNumbers: true,
};
```

#### Ordering the tab strip with `sandpackPriorityFiles`

By default the tab strip follows the files-object order and Sandpack opens the template's `main` (`/App.tsx` for `react-ts`). When an example has files a reader should see first — e.g. the agent-setup files in the map agent examples — declare `sandpackPriorityFiles` to float them to the front and open the top one:

```typescript
// my-example/sandpack.ts
// Ordered list of VFS path prefixes; a trailing `/` matches a whole folder.
export const sandpackPriorityFiles: readonly string[] = [
  '/agent/system-prompt.ts', // exact file
  '/agent/',                 // then the rest of the folder
  '/useMapAgent.ts',
];
```

- Each entry is a VFS path **prefix**: a file ranks by the first prefix it `startsWith`, so `/tools/` floats the whole folder while `/App.tsx` targets one file.
- Unranked files keep their original order after the ranked ones; **no file is hidden** — every non-hidden file still appears in the tabs.
- `getSandpackFilesAndOptions` turns this into standard `visibleFiles` / `activeFile` `SandpackOptions` (see `buildVisibleAndActiveFileOptions` in `src/sandpack/sandpackUtils.ts`). Because it rides the returned `options`, any consumer that spreads them into `<Sandpack>` (the exported `LiveCodingExample`, and the docs portal's `SDKGuideLiveCodingExample` that wraps it) honours the order with **no extra work** — no reliance on files-object key order surviving the trip.
- Omit it (or leave it empty) to keep Sandpack's default ordering.

The Sandpack preview:

- Automatically loads all example files (index.html, index.ts, style.css)
- Hides utility files (config.ts) by default
- Uses the amethyst theme with custom colors
- Resolves workspace dependencies to their published versions
- Injects API keys from environment variables

### Testing SDK Changes

Examples resolve `@tomtom-org/maps-sdk/*` through `core/dist`, `services/dist`
and `map/dist`, so an SDK edit only reaches them once it is built:

```bash
pnpm build:sdk                       # or pnpm -F map build for a map-only change
cd examples/<example-name> && pnpm develop
```

### End-to-End (E2E) Testing and snapshots

Web examples have E2E tests; Node.js examples do not.

> **Build first, twice.** The sanity test loads the example from `dist/`, never
> from a dev server, and it runs as **two tagged tests**: `@prod` serves
> `dist/prod` on port 9050, `@sandpack` serves `dist/sandpack` on 9051.
> Playwright starts both servers but builds neither, so a missing build leaves
> that half serving a blank or 404 page — failing identically to a real
> regression. This applies to every command below, the root-level
> `e2e-test:examples:update-snapshot` and `generate-thumbnails:examples`
> included.

```bash
# 1. The SDK, then BOTH bundles of the example
pnpm -F map build
pnpm -F @examples/<example-name> build            # → dist/prod  (@prod, 9050)
pnpm -F @examples/<example-name> build:sandpack   # → dist/sandpack (@sandpack, 9051)

# 2. From inside the example
cd examples/<example-name>
pnpm test:e2e                    # run
pnpm test:e2e:update-snapshots   # regenerate its baselines
pnpm test:e2e:ui                 # interactive

# Or, from the repo root, per example or across all of them
pnpm e2e-test:examples:update-snapshot <example-name>
pnpm e2e-test:examples:update-all-snapshots
```

Some examples assert CORS headers against a live API key and fail offline; that
is expected and does not block a snapshot update.

**The committed artifacts**, all under `e2e-tests/snapshots/` except the
thumbnail:

| File | What it is | Regenerated by |
|---|---|---|
| `upon-load.png` | the `@prod` whole-page shot of `dist/prod`, at `maxDiffPixelRatio: 0.15` | `test:e2e:update-snapshots`, or the root scripts above |
| `upon-load-sandpack.png` | the `@sandpack` shot of the Sandpack preview of `dist/sandpack` | same |
| `ui-temp-upon-load.png` | TEMPORARY (`src/e2e-test-utils/tempUiSnapshot.ts`): the example's own chrome with the map hidden, at zero tolerance, on the examples that have chrome | **CI only** — the baseline is a Linux capture and the check self-skips elsewhere, so it comes from the CI job's `ui-temp-baselines` artifact |
| `content/thumbnail.png` | the docs-portal gallery image | `pnpm generate-thumbnails:examples <example-name>` (omit the name for all), which resizes `upon-load.png` to 1000×500 |

Order matters: snapshot first, thumbnail second, commit both. A thumbnail
derived from a stale snapshot is the usual cause of a gallery image that no
longer matches the example. A brand-new example has neither file until the first
update run writes them.

The `tomtom-maps-sdk-js-example-authoring` skill carries this workflow as an
ordered procedure, plus the diagnosis when a run looks wrong.

### Example Structure

Per-example contents are the two "Minimum Ingredients" sections above. What sits
at the `examples/` root, shared by all of them:

```
examples/
├── vite.config.ts                   # the gallery app itself
├── example-vite.config.ts           # per-example dev + prod build
├── example-sandpack-vite.config.ts  # per-example Sandpack build
├── exampleBuildEnv.ts               # EXAMPLE_ENV_VARS — the build-time env allowlist
├── playwright.config.ts             # buildPlaywrightConfig + the 9050 / 9051 port constants
├── src/
│   ├── constants/tags.ts            # the closed tag vocabulary
│   ├── e2e-test-utils/              # sanityE2ETest, tempUiSnapshot, shared test constants
│   ├── sandpack/                    # LiveCodingExample, sandpackUtils, local preview
│   ├── demos-proxy/                 # the session bootstrap injected in demos-proxy mode
│   └── templates/                   # the shared HTML and CSS above
└── scripts/generate-thumbnails.sh   # snapshot → 1000×500 thumbnail
```

An example's own `package.json` scripts, `playwright.config.ts` and
`tsconfig.json` are one-liners delegating here, which is why copying
`default-map` gets them right and hand-writing them does not.

## Contributor Workflows

**Contributor wants to:**

- **Test new SDK feature** → Add example demonstrating the feature
- **Verify bug fix** → Run affected examples to validate fix
- **Document API usage** → Create example showing best practices
- **Change what an example does** → Update its `content/page.mdx` body in the same pass (see [The page.mdx body](#the-pagemdx-body))
- **Regenerate a gallery image** → `pnpm generate-thumbnails:examples <example-name>`, after refreshing its snapshot
- **Test example interactively** → Use `pnpm develop:sandpack` for live code editing

## Example Catalog

### Map Basics

- **default-map** - Basic map initialization with styles, center, and zoom
- **map-language** - Display maps in different languages
- **reset-state-when-changing-style** - Carry the map state across a style switch, or drop it

### Geometry & Data Visualization

- **basic-geometry** - Display simple geometries (points, lines, polygons)
- **multiple-geometries** - Show multiple geometric shapes on one map
- **byod-geojson-heatmap** - Create heatmaps from GeoJSON data
- **layer-group-toggling** - Toggle layer groups on/off
- **map-styling-playground** - Semantic styling knobs (sizes, toggles, base-map groups, hillshade, POI and traffic colours, view, presets) from a panel built off `StylingModule.describe()`, plus one `styling.layers.query` edit
- **globe-terrain** - Globe projection and sky/atmosphere through the styling module's `view.*` knobs, 3D terrain through `TerrainModule`
- **map-colors** - Recolour the base map with the ten semantic colours (`setMapColors`) and export the rendered style
- **terrain-playground** - A pitched satellite map over four mountain viewpoints; terrain, sky and exaggeration survive a style switch, with a depth-of-field toggle
- **map-effects-playground** - The map-effects plugin: bloom, grade, tint, fog, edge blur, depth of field, vignette and high-DPI capture
- **layer-groups-visibility-animation** - Animate layer visibility changes

### Search & Geocoding

- **geocode** - Convert addresses to coordinates (forward geocoding)
- **geocode-init** - Initialize map at geocoded location
- **reverse-geocode** - Convert coordinates to addresses
- **rev-geo-json** - Reverse geocode with full GeoJSON response
- **rev-geo-playground** - Reverse geocode a clicked point, with search radius, heading, area types and geopolitical view on one panel
- **autocomplete-fuzzy-search-playground** - Search with autocomplete suggestions
- **search-places-in-geometry** - Search for places in the geometry of a geocoded location
- **search-places-nearby-location** - Search for places in nearby the center of a geocoded location

### Geometry Search

- **geometry-search-playground** - Search within custom geometries
- **geometry-search-with-poi-categories** - Search for specific POI types in areas

### Routing

- **route** - Basic A-to-B routing and route visualization
- **route-with-alternatives** - Calculate and show alternative routes
- **route-with-guidance** - Turn-by-turn navigation instructions
- **route-multiple-origins** - Calculate routes from multiple starting points
- **route-multiple-origin-destinations** - Multiple origin and destination combinations
- **waypoints** - Routes with intermediate stops
- **route-reconstruction** - Reconstruct routes from GPS traces
- **route-monitor-traffic** - Routes considering live traffic
- **route-geometry-searches** - Find POIs along a route
- **route-leg-options-playground** - Per-leg route type and avoid list on a multi-stop route
- **route-stop-wait-playground** - How long a route waits at a stop, on the pin and in the journey time
- **routing-composite** - Geocode, EV route, search along it and reachable range, chained so each call feeds the next

### Routing Customization

- **route-custom-main-color** - Customize route line color
- **route-styling-playground** - Interactive route styling with theme properties and layer overrides
- **route-sections-playground** - Every route section type on one set of knobs, and the speed-limit sign controls
- **route-speed-signs** - Four short routes, each posting its speed limits as its own country's road sign
- **route-waypoint-icon-style** - Custom waypoint markers
- **route-maplibre-customization** - Advanced route styling with MapLibre

### EV Routing

- **ldevr-model-id** - EV routing with vehicle model
- **ldevr-detailed-vehicle** - Detailed EV parameters for routing
- **ldevr-custom-charging-stops** - Custom charging station preferences
- **ldevr-preferences-playground** - Tune EV charging preferences and see where the charging time goes
- **reachable-ranges** - Calculate reachable area on single charge
- **ev-charging-stations-search** - Interactive exploration of charging station availability data
- **ev-charging-stations-custom-display** - Customize EV charging station icons, text, and availability display

### Places & POIs

- **places-customize-playground** - Customize place markers
- **places-default-icon-styling** - Default place icon styles
- **places-maplibre-customization** - Advanced place styling with MapLibre
- **places-multiple-icons-same-category** - Different icons for same category
- **places-in-geometry** - Display places within a defined area
- **poi-filters** - Filter POIs by category

### Interactions

- **pin-interaction** - Interactive map pins with click handlers
- **map-events** - Map interaction events (click, hover)
- **interactive-roads-and-numbers** - Interactive road highlighting
- **rest-of-the-map-click** - Detect clicks outside a known feature

### Traffic

- **traffic-flow** - Display traffic flow on roads
- **traffic-bloom-effect** - Live traffic glowing over a mono dark map, with bloom scoped by colour (`bloom.only`) to all traffic or to major jams
- **bloom-effect-playground** - Every bloom knob on one panel, `bloom.only` included, across all seven styles
- **traffic-incidents** - Show traffic incidents and alerts
- **traffic-area-analytics** - Visualize traffic area analytics with hexgrid and heatmap modes
- **traffic-config-playground** - Configure traffic display options

### Map Configuration

- **map-config-playground** - Explore various map configuration options
- **load-style-parts** - Load specific style components

### Terrain

- **hillshade** - Shade the relief with `TerrainModule`'s hillshade
- **3d-terrain** - Raise the map surface in 3D with 3D buildings and landmarks standing on it

### Plugins

- **landmarks-3d-plugin** - Render Orbis 3D Landmarks with the Landmarks 3D plugin
- **viewport-places-plugin** - Viewport Places Plugin example

### Node.js Examples

- **nodejs-geocode** - Server-side geocoding
- **nodejs-rev-geo** - Server-side reverse geocoding
- **nodejs-routing** - Server-side route calculation
- **nodejs-geometry-search** - Server-side geometry search
