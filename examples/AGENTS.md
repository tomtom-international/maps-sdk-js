# AGENTS.md - Examples

**Live examples demonstrating SDK features** - 50+ working examples showcasing maps, search, routing, and more.

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

### Overview

This directory contains 50+ runnable examples demonstrating SDK features:

- Map display and interaction
- Search and geocoding
- Routing and navigation
- Traffic visualization
- Places and POI management
- Custom styling and theming

Each example is a standalone application you can run and modify.

### Development Setup

```bash
# From repo root
pnpm install
pnpm build

# Run an example in development mode
cd examples/<example-name>
pnpm develop
# Open browser to http://localhost:5173/<example-name>

# Or run with Sandpack live coding preview
pnpm develop:sandpack
# Open browser to see interactive code editor with live preview
```

See [../CONTRIBUTING.md](../CONTRIBUTING.md) for detailed setup.

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

### The page.mdx body

Every example page on the portal (`/maps-sdk-js/examples/<name>`) renders the
body of `content/page.mdx` in the slot **below the live demo and above "Related
examples"**. `title` and `description` are already printed above the demo, so
the reader reaches the body having watched the example run.

The body has exactly two jobs: **name what the example showcases**, and show
**how little SDK surface it took**. It is not a tutorial — no setup steps, no
API-key instructions, no parameter tables, no "in this example we will…", and no
restating the `description`.

**Shape** — around 90 words, 120 at the outside:

1. A lead of one or two sentences: the outcome the reader just watched.
2. Two to four bullets, one line each. Each names the SDK symbol doing the work,
   and what that call spares the caller. When a guide explains that symbol or
   concept, its first mention links to the narrowest applicable guide section.

Past that ceiling the copy has started explaining the domain instead of the SDK,
or the example is demonstrating more than one idea.

**Rules**

- **No headings.** `##` renders at the same weight as the page's own "Related
  examples" heading, so it reads as a new page section rather than as part of
  the example.
- **Concrete over adjectives** — "one call", "no layer wiring", "the response is
  already GeoJSON"; never "powerful", "seamless", "effortless", "simply",
  "just".
- **Name the exported symbol**, spelled as it is exported:
  `withInsertedWaypoints`, `RoutingModule.create`, `calculateRoute`.
- **Embed guide links in the key code words** — for example,
  [`withInsertedWaypoints`](/maps-sdk-js/guides/core/utilities/routes#withinsertedwaypoints).
  Prefer the section that explains the exact call or concept over the top of its
  guide. Link every principal call that has useful guide coverage; do not impose
  a one-link quota or add a detached "More in…" line.
- **Links are root-relative and carry no `.mdx`** —
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
Two waypoints go in, a route comes back, and the chargers beside it land on the map as extra
stops, in along-route order, on a single recalculation.

- [`search`](/maps-sdk-js/guides/services/places/search#along-route-search) takes the route
  itself as an input, so "along this route, within this detour" is a query rather than a
  post-filter.
- [`withInsertedWaypoints`](/maps-sdk-js/guides/core/utilities/routes#withinsertedwaypoints)
  projects old and new stops onto the route once and orders them, so the insert positions are
  not yours to work out.
- [`RoutingModule.showRoutes`](/maps-sdk-js/guides/map/routes#displaying-routes) and
  [`showWaypoints`](/maps-sdk-js/guides/map/routes#waypoints) redraw the updated journey
  straight from the service response, with no layer bookkeeping.
```

The `tomtom-maps-sdk-js-example-authoring` skill carries the drafting pass that
gets you there.

---

### Creating a New Example

```bash
# Copy an existing example as template
cp -r default-map my-new-example      # web
cp -r nodejs-geocode nodejs-my-example  # Node.js

# Edit files in my-new-example/src/
# Test your example
pnpm develop
# Navigate to http://localhost:5173/my-new-example
```

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

```bash
# 1. Make changes in ../map or ../services
cd ../map
pnpm build

# 2. Return to examples and test
cd ../examples
pnpm dev

# Examples automatically use the built SDK from workspace
```


### End-to-End (E2E) Testing

Web examples have E2E tests (Node.js examples do not).

> **Build first.** The sanity E2E test loads the example from its `dist/`
> output, not from the dev server. Run `pnpm -F map build` and
> `pnpm -F @examples/<example-name> build` **before** any
> `test:e2e` / `test:e2e:update-snapshots` invocation, otherwise the run will
> serve stale or missing assets. The same applies to the root-level
> `pnpm e2e-test:examples:update-snapshot` and `pnpm generate-thumbnails:examples`
> commands further down.

**Quick commands:**
```bash
# 1. Build the SDK and BOTH bundles of the example you're targeting
pnpm -F map build
pnpm -F @examples/<example-name> build            # → dist/prod, served on 9050 for the @prod test
pnpm -F @examples/<example-name> build:sandpack   # → dist/sandpack, served on 9051 for @sandpack

# 2. Then run E2E from inside the example
cd examples/<example-name>
pnpm test:e2e                    # Run tests
pnpm test:e2e:update-snapshots   # Regenerate the snapshots
pnpm test:e2e:ui                 # Interactive UI mode
```

Playwright starts both servers but builds neither: skip a build and that half serves a blank page,
failing identically to a real regression.

**New example checklist.** When you add a brand-new example, the snapshot and
thumbnail don't exist yet — the first `pnpm test:e2e:update-snapshots` writes
`e2e-tests/snapshots/upon-load.png`, and `pnpm generate-thumbnails:examples
<example-name>` then derives `content/thumbnail.png` from it. Commit both
files alongside the example source.

A web example's snapshots under `e2e-tests/snapshots/` (all committed):
- `upon-load.png` — the `@prod` test's whole-page shot of `dist/prod`, at `maxDiffPixelRatio: 0.15`
- `upon-load-sandpack.png` — the `@sandpack` test's shot of the Sandpack preview of `dist/sandpack`
- `ui-temp-upon-load.png` — TEMPORARY (`src/e2e-test-utils/tempUiSnapshot.ts`): the example's own
  chrome with the map hidden, at zero tolerance, on the examples that have chrome. The baseline is
  a Linux capture and the check **self-skips outside CI**, so it can only be regenerated from the
  CI job's `ui-temp-baselines` artifact — never locally.

The `tomtom-maps-sdk-js-example-authoring` skill carries this workflow as an ordered procedure.

### Snapshot & Thumbnail Workflow

Each browser example has two image artifacts that must be kept in sync when example output changes:

| File | Purpose | How generated |
|---|---|---|
| `e2e-tests/snapshots/upon-load.png` | Playwright visual regression baseline | `pnpm test:e2e:update-snapshots` (per-example) or root scripts below |
| `content/thumbnail.png` | Shown in docs portal example gallery | `generate-thumbnails.sh` — resizes the snapshot to 1000×500 |

**Update snapshots for specific examples** (from repo root):
```bash
pnpm e2e-test:examples:update-snapshot <example-name>

# Then regenerate the thumbnail from the fresh snapshot:
pnpm generate-thumbnails:examples <example-name>
```

**Update all snapshots at once** (from repo root):
```bash
pnpm e2e-test:examples:update-all-snapshots

# Then regenerate all thumbnails:
pnpm generate-thumbnails:examples
```

**Prerequisites:**
- The map package and the affected examples must be built before running snapshot/thumbnail commands:
  ```bash
  pnpm -F map build
  pnpm -F @examples/<example-name> build
  pnpm -F @examples/<example-name> build:sandpack
  ```
- The Playwright test servers serve from `dist/prod` (`start-test-server:prod`, port 9050) and
  `dist/sandpack` (`start-test-server:sandpack`, port 9051) — both bundles must be built first.
- CORS-header tests in some examples require a live API key and will fail in offline/CI environments — this is expected and does not block snapshot updates.
- Commit both `upon-load.png` and `thumbnail.png` after updating.

### Example Structure

```
examples/
├── vite.config.ts                   # Vite configuration for all examples
├── example-vite.config.ts           # Individual example config
├── example-sandpack-vite.config.ts  # Sandpack preview config
├── src/
│   └── sandpack/
│       ├── LiveCodingExample.tsx    # Sandpack component
│       └── localPreview/           # Local preview app
├── default-map/                    # Web example
│   ├── src/
│   │   ├── index.html
│   │   ├── index.ts
│   │   ├── style.css
│   │   └── config.ts
│   ├── content/
│   │   ├── page.mdx
│   │   └── thumbnail.png
│   ├── e2e-tests/
│   │   ├── sanity.test.ts
│   │   └── snapshots/upon-load.png
│   ├── sandpack.ts
│   ├── package.json
│   ├── playwright.config.ts
│   └── tsconfig.json
└── nodejs-geocode/                 # Node.js example (no HTML, no CSS, no e2e)
    ├── src/
    │   ├── index.ts
    │   └── config.ts
    ├── content/
    │   ├── page.mdx
    │   └── thumbnail.png
    ├── sandpack.ts
    ├── package.json
    └── tsconfig.json
```

## Contributor Workflows

**Contributor wants to:**

- **Test new SDK feature** → Add example demonstrating the feature
- **Verify bug fix** → Run affected examples to validate fix
- **Document API usage** → Create example showing best practices
- **Change what an example does** → Update its `content/page.mdx` body in the same pass (see [The page.mdx body](#the-pagemdx-body))
- **Generate thumbnails** → Run `pnpm generate-thumbnails` (see scripts)
- **Test example interactively** → Use `pnpm develop:sandpack` for live code editing
- **Share interactive demo** → Create sandpack.ts to customize the preview experience

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
- **map-styling-playground** - Semantic styling knobs (sizes, toggles, POI and traffic colours, view, presets) from a panel built off `StylingModule.describe()`
- **globe-terrain** - Globe projection, sky/atmosphere and 3D terrain through the styling module's `view.*` knobs
- **map-effects-playground** - The map-effects plugin: bloom, grade, tint, fog, edge blur, vignette and high-DPI capture
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
- **traffic-incidents** - Show traffic incidents and alerts
- **traffic-area-analytics** - Visualize traffic area analytics with hexgrid and heatmap modes
- **traffic-config-playground** - Configure traffic display options

### Map Configuration

- **map-config-playground** - Explore various map configuration options
- **load-style-parts** - Load specific style components

### Terrain

- **hillshade** - Display terrain with hillshading

### Plugins

- **landmarks-3d-plugin** - Render Orbis 3D Landmarks with the Landmarks 3D plugin
- **viewport-places-plugin** - Viewport Places Plugin example

### Node.js Examples

- **nodejs-geocode** - Server-side geocoding
- **nodejs-rev-geo** - Server-side reverse geocoding
- **nodejs-routing** - Server-side route calculation
- **nodejs-geometry-search** - Server-side geometry search

## Common Example Patterns

See "Minimum Ingredients" sections above for the canonical file contents. The key patterns are:

- `config.ts` exports `API_KEY` from `process.env.API_KEY_EXAMPLES` — never hardcode keys
- `TomTomConfig.instance.put({ apiKey: API_KEY })` is always the first SDK call
- Map container div id is `sdk-map` (not `map`)
- All source files live under `src/` inside each example directory

## Important Notes

- **Requires API key** - Set `apiKey` in examples (most use placeholder)
- **Hot reload** - Examples auto-reload when you edit code
- **Workspace packages** - Examples use local SDK build, not npm
- **Real APIs** - Examples make real API calls to TomTom services
- **Browser only** - These are web examples (for Node.js examples, see those prefixed with `nodejs-`)
- **Live examples online** - View at https://docs.tomtom.com/maps-sdk-js/examples/
