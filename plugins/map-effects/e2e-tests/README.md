# Map effects visual tests

What each effect does to a picture, measured — over a **synthetic map** drawn into a canvas, so a
case needs no tile, no network call and no API key, and is the same picture on every machine.

## Why a browser, and why not jsdom

Neither half of this plugin can be reached from a Node test:

- the overlays are `backdrop-filter` and `mix-blend-mode`, which live in the compositor and appear
  in no element's own pixels — so they are **photographed**, never read back off a canvas;
- the depth of field is a **WebGL2 pass**, which jsdom has no context for.

The unit tests under `src/tests/` cover the arithmetic that leads up to both (the filter strings,
the optics in `defocusUniforms`). This suite covers what the browser then does with it.

## Why measurements and not only snapshots

A baseline recorded from a broken build locks the bug in, and a snapshot cannot state the claim
anyway: "the near ground stayed sharp and the far ground did not" is a relation between two parts
of one picture. So every effect is asserted to **move the frame the way its name says** —
reversals per row for a defocus, level for a glow, chroma for a saturation, a radial difference for
a rim effect — and the committed images hold the look rather than the claim.

The subject (`app/subject.ts`) is drawn to carry the same detail at every height, which is what
makes the depth-of-field bands comparable: a lens that did nothing would otherwise still measure as
sharper at the bottom.

## Relation to the example's shots

`examples/map-effects-playground` photographs the same effects over a **real** map, where traffic
moves through the day and the tolerance has to be wide enough to let it. That suite is the proof
the plugin works against a live MapLibre canvas; the claims live here, where the subject holds
still.

## Setup (one-time)

`@playwright/test` is a `devDependency` of the package. Install the Chromium binary once:

```bash
pnpm -F @tomtom-org/maps-sdk-plugin-map-effects test:e2e:install
```

## Run

```bash
pnpm e2e-test:map-effects                                               # from the repo root
pnpm -F @tomtom-org/maps-sdk-plugin-map-effects test:e2e                # headless
pnpm -F @tomtom-org/maps-sdk-plugin-map-effects test:e2e:ui             # Playwright UI
pnpm -F @tomtom-org/maps-sdk-plugin-map-effects test:e2e:update-snapshots
```

The config starts the harness' Vite server itself, and serves the plugin **from source** — a change
to a shader or an overlay is under test the moment it is saved. In CI the suite is picked up by the
`e2e-test-plugins` matrix, which runs every plugin that owns a `test:e2e` target.

Every project here renders through SwiftShader (`--enable-unsafe-swiftshader`), so the depth-of-
field pass runs in a headless container and renders the same picture on every machine.
