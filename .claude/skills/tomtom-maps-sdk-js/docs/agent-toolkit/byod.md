# Agent Toolkit — BYOD (bring-your-own-data)

Customer-authored GeoJSON layers ingested via `addByodSource` (URL fetch or inline) and registered as `byod` entries.
Tools: `addByodSource`, `setByodLayers`, `recallByod`, `updateByodDisplay`.
See [tools.md](./tools.md) for the registry, [state.md](./state.md) for the `byod` slice,
[data-tools.md](./data-tools.md) for using `byod` entries as analyse/process inputs.

---

## Ingest & profile

On ingest (every path — URL, inline, programmatic `state.byod.addEntry`) the slice auto-detects a `BYODDataProfile`:
`featureCount`, `geometryTypes`, and a per-property profile (`name`, JSON `types`, `coverage`, capped `examples`),
inferred locally in one pass — no extra service call.
`addByodSource` returns it; `recallByod` exposes `propertyNames` in the list and the full `profile` when given an `id`.
The model uses it to pick fields for `analyseData` / `processData` without re-fetching raw GeoJSON.

## Untrusted-data handling

BYOD content is customer-supplied, so all model-facing results pass through `toByodSafeProfile` (`state/byod/profile.ts`) —
it withholds **string** example values (prompt-injection vector),
keeping `name`/`types`/`coverage` + numeric/boolean examples;
and `recallByod` **never** returns the raw `FeatureCollection`
(the full profile incl. string examples stays on the entry for host UI).
Compute over feature values via `analyseData`/`processData`, not by echoing raw data back.

## URL fetch policy

`addByodSource` URL fetches are bounded (http(s) only, 25 MB cap, 15 s timeout);
to restrict *where* fetches may go, pass
`byod.validateSourceUrl: (url) => { valid: true } | { valid: false; reason: string }` to `createMapAgent`
(return `{ valid: false, reason }` to block — `reason` surfaces as the tool error — or `{ valid: true }` to allow;
sync or async; runs after the scheme check, before the fetch; URL path only — inline `data` isn't gated).
Stored on `state.byod.sourceUrlValidator`.

## Layers & display

A new entry has **no layers** and renders nothing — there are no automatic geometry defaults;
`addByodSource.show` (`{ zoomMode, hidePreviousEntries }`, optional) only fits the camera and clears earlier BYOD layers.

Deciding the layers that fit the data is the agent's job on EVERY ingest via `setByodLayers` —
also the only way a BYOD entry becomes visible —
which replaces an entry's MapLibre layers wholesale (raw layer `type` + `paint`/`layout`/`filter`)
so the model can graduate `circle-radius` by a numeric field, colour a `fill`/`line` by category,
switch points to `symbol`, etc. — informed by the `profile`.

It applies live in place on a shown entry (via the module's `applyConfig` runtime layer diff),
or `show` renders a hidden one;
invalid specs are rejected with a semantic error and leave the entry's previous layers intact.

## Disabling BYOD

```ts
createMapAgent(map, {
    model,
    dataEntries: {
        byod: { enabled: false },  // drops byod from analyseData/processData scope
                                   // + removes recallByod / addByodSource / setByodLayers / updateByodDisplay
    },
});
```
