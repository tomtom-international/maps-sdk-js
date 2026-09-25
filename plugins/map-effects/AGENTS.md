# AGENTS.md — Map effects plugin

**`@tomtom-org/maps-sdk-plugin-map-effects`** — post-processing computed from the rendered map's own pixels:
bloom (optionally scoped by colour), grade, tint, fog, edge blur, a WebGL depth of field, vignette, and
high-DPI capture. Customer docs: the [map effects guide](../../documentation/docs-portal/guides/plugins/map-effects.mdx).

[`CODING_GUIDELINES.md`](../../CODING_GUIDELINES.md) and [`plugins/AGENTS.md`](../AGENTS.md) apply; this file adds
what is specific to this plugin.

## Source map

| File | Owns |
|---|---|
| `src/MapEffects.ts` | The public class: knobs, live overlays, the GPU chain, bloom, capture |
| `src/effectsCatalogue.ts` | Every knob's kind, range or options, default and use case — what `describe()` returns |
| `src/effectFilters.ts` | The filter and optics arithmetic the live overlays and the capture share |
| `src/composite.ts` | The capture path: the same effects composited onto one 2D canvas |
| `src/bloomScope.ts` | `bloom.only`: resolving a scope's colours and keying the pixels on them |
| `src/gpu/` | The WebGL2 screen-pass substrate and its shaders (`.glsl`) |
| `e2e-tests/` | The visual suite over a synthetic map — see below and its [README](./e2e-tests/README.md) |

## Every effect ships a visual test

**A change that adds an effect, or a knob that changes where or how an effect lands** (a scope, a mask, a
band, a blend), is not done until the visual suite covers it, in the same PR:

1. **A case** in `e2e-tests/app/cases.ts` — the knobs, and a camera when the effect reads one.
2. **A measured claim** in `e2e-tests/effects.spec.ts`, stated in a statistic from `e2e-tests/app/measure.ts`
   (level, spread, chroma, channel means, per-band sharpness or brightness, rim difference). Add a statistic
   there when none can state the claim; a snapshot alone locks in whatever the first run drew.
3. **The committed snapshot**, `e2e-tests/snapshots/<case-id>.png`, written by the first run.

What does not count instead:

- **Unit tests under `src/tests/`** — jsdom has no compositor and no WebGL2, so they reach the arithmetic and
  never the picture.
- **Example shots over a live map** (`examples/map-effects-playground`, `examples/traffic-bloom-effect`) — traffic
  moves through the day, so their tolerance has to absorb what an effect regression would change. They prove
  the plugin runs against a real MapLibre canvas; the claims live here.

The harness mounts the real `MapEffects` over a **stub map** in `e2e-tests/app/main.ts`: a canvas, two camera
angles and a traffic palette. An effect that reads more of the map extends that stub; the harness never
draws overlays of its own, or it would photograph itself.

## Commands

```bash
pnpm -F @tomtom-org/maps-sdk-plugin-map-effects test                       # unit tests
pnpm e2e-test:map-effects                                                  # visual suite, no API key, ~10s
pnpm -F @tomtom-org/maps-sdk-plugin-map-effects test:e2e:update-snapshots  # after an intended look change
```

The visual suite serves the plugin from source, so it needs no build; CI runs it in the `e2e-test-plugins`
matrix.

## Docs that move with a knob

A new or changed knob reaches the guide's catalogue table and the section explaining it, the skill doc
`.claude/skills/tomtom-maps-sdk-js/docs/map-effects.md` (plus that skill's keyword column), and the table in
[`README.md`](./README.md). It also needs a changeset naming the plugin (see
[`.changeset/README.md`](../../.changeset/README.md)), which states the SDK release it needs when it uses a
newer SDK export than the peer range's floor.
