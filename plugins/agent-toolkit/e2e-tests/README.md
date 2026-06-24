# Agent toolkit e2e

Browser-based, end-to-end tests for the agent toolkit that need **real browser
semantics** the Node/jsdom unit tests and the (model-driven, mocked-execute)
`src/tests/scenarios` suite cannot provide.

Today this hosts a single suite — the **sandbox isolation** spec below — because
that was the first feature to require a real browser. It is intended to grow into
the toolkit's general agent e2e harness: not just the code-execution tools, but
**"vanilla" agent flows that combine many tools** end to end (e.g. locate → route
→ traffic → BYOD restyle) driving a real map in a real browser, asserting on the
resulting map state rather than on which tool the model picked. Add new specs
alongside `sandbox-isolation.spec.ts`; share the `app/` harness and Playwright
config where it fits, and split per-flow specs as the surface grows.

## Suites

### Sandbox isolation — `sandbox-isolation.spec.ts`

Verifies the **iframe-worker** code-execution sandbox (mandatory in the browser)
under real browser semantics — CSP enforcement, opaque-origin iframes, and Worker
termination — which the Node unit tests (jsdom) cannot exercise. These are the
checks that gate relying on the isolated executor as a security boundary.

It drives `app/` (a tiny Vite page exposing `window.runInSandbox(code)` wired to
the executor from SDK source) and asserts:

1. **zero-config libs** — `turf` and `h3` run inside the worker (the SDK's bundled
   UMD lazy chunk loads, no `loadWorkerLibrarySource` needed);
2. **no network egress** — `fetch(...)` inside sandbox code fails (CSP + shadowing);
3. **termination** — a `while (true) {}` body is killed at the 2 s timeout and the
   main thread stays responsive;
4. **no parent access** — sandbox code sees `localStorage` / `document` as
   `undefined` (opaque origin + shadowing).

## Setup (one-time)

`@playwright/test` is a `devDependency` of the package. Install the Chromium
browser binary once (Playwright doesn't ship it):

```bash
pnpm --filter @tomtom-org/maps-sdk-plugin-agent-toolkit test:e2e:install
```

## Run

```bash
pnpm --filter @tomtom-org/maps-sdk-plugin-agent-toolkit test:e2e      # headless
pnpm --filter @tomtom-org/maps-sdk-plugin-agent-toolkit test:e2e:ui   # Playwright UI
```

The `test:e2e` script points Playwright at `e2e-tests/playwright.config.ts`, which
starts the Vite dev server (`app/`) automatically — no manual `cd` needed.

In CI this runs as the dedicated **`e2e-test-agent-toolkit-sandbox`** job (root
script `pnpm e2e-test:agent-toolkit:sandbox`), in the Playwright container — kept
separate from the browser-free unit-test runs.

> **Status:** the suite **passes (5/5)** in headless Chromium — turf/h3 run in the
> worker, network egress is blocked, a runaway loop is terminated, and parent
> storage/DOM are unreachable. The iframe-worker sandbox is therefore verified as a
> boundary by these checks.
