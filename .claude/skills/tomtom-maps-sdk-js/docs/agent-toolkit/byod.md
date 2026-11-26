# Agent Toolkit — BYOD (bring-your-own-data)

Customer GeoJSON registered as `byod` datasets — fetched from a URL, passed inline, or added by your app.
Tools: `addByodSource`, `setByodLayers`, and `updateDatasetDisplay` with `slice: 'byod'`.
See [tools.md](./tools.md) for the registry, [state.md](./state.md) for the `byod` slice,
[data-tools.md](./data-tools.md) for `byod` datasets as `analyseDatasets` / `deriveDatasets` inputs.

---

## Tools

```ts
addByodSource({ label, url?, data?, datasetId? });   // exactly one of url / data
// → { byodDatasetId, label, source: { kind: 'url', url } | { kind: 'inline' }, profile }

setByodLayers({
    datasetId,
    layers: [{ type, paint?, layout?, filter?, id?, beforeID? }], // ≥ 1; replaces the dataset's layers
    show?: { zoomMode: 'auto' | 'none', hidePreviousDatasets?: 'all' | string[] }, // render a hidden dataset / re-fit
});
// → { datasetId, label, layerCount, layerTypes, shown? }

updateDatasetDisplay({ slice: 'byod', add?, remove?, addMatching?, removeMatching?, clear?, drop?, fitBounds? });
// clear: hides every shown byod dataset, and with add swaps to those; drop: hides and removes them from history
```

From app code: `await agent.state.byod.addDataset({ label: 'Depots', data: featureCollection, layers?, producedFrom?, id? })`;
it renders nothing until `await agent.state.byod.showDataset(id)`, which draws it with those `layers`.
`agent.state.byod.getDatasetLayers(id)` returns the dataset's current layers, which `setByodLayers` replaces.

Mirroring a live feed: call `await agent.state.byod.upsertDataset({ id: 'vehicles', label, data, timestamp? })` on every
update instead of `findById(id) ? replaceDatasetData(…) : addDataset(…)`. A new `id` adds the dataset (`'added'`); a
known one replaces its data and timestamp (`'replaced'`), redrawing it and re-running its event rules and monitored analyses,
and keeps its `label` and the layers the agent set; it takes a `producedFrom` you pass, and keeps the old one otherwise.
A slice's upserts and `removeDataset` calls run in call order, so the last one wins: a dataset removed right after an
upsert stays removed, with no queue of your own. The removed dataset leaves `datasets` only then, so await
`removeDataset` before adding another under its id (else the new one gets a `-2` suffix).

## Profile

Every ingest path infers a `DatasetProfile` locally, in one pass: `featureCount`, `geometryTypes`, and per property
`name`, JSON `types`, `coverage` and capped `examples` (`propertiesOmitted` when capped). `addByodSource` returns it,
and so does a `deriveDatasets` run that writes or revises a BYOD dataset (`profile` beside `byodDatasetId` /
`byodFeatureCount`, the `deriveDatasets` function's result included); `recallState({ slice: 'byod' })` lists
`propertyNames`, and `{ slice: 'byod', id }` returns the profile.

## Untrusted data

Model-facing results get a safe profile: **string** example values are withheld (prompt-injection vector),
`name` / `types` / `coverage` and numeric / boolean examples stay. `recallState` never returns the raw `FeatureCollection`;
the full profile stays in `state.byod.profile(id)` for your UI. The model computes over values with `analyseDatasets` / `deriveDatasets`.

## URL fetch policy

Every URL fetch: http(s) only, 25 MB cap, 15 s timeout, `credentials: 'omit'`, `redirect: 'error'`. Any fetch
failure (network, HTTP status, size, timeout, redirect, non-JSON, not a FeatureCollection) returns one generic error to
the model — no status, body fragment or host-existence signal.

Default policy (no `validateSourceUrl`): **public `https:` URLs only**. Refused before any request: `http:`, the page's
own origin, `localhost` / `*.localhost` / `*.local` / `*.localdomain` / `*.internal` / `*.home.arpa` / single-label hostnames, and loopback, private
(RFC 1918, `fc00::/7`), link-local (`169.254/16` — cloud metadata — and `fe80::/10`) and other non-public IP literals.
No DNS resolution in the browser, so a public hostname resolving to a private address passes.

`validateSourceUrl` **replaces** the default policy (the fetch limits above still apply):

```ts
createMapAgent(map, {
    model,
    byod: {
        validateSourceUrl: (url) =>
            url.protocol === 'https:' && url.hostname === 'data.example.com'
                ? { valid: true }
                : { valid: false, reason: 'Host not allowed' },
    },
});
```

- `url` is a `URL`; sync or async; runs after the http(s) check, before the fetch.
- To load from your own origin or a local dev server (`http://localhost:…`), allow exactly those URLs here.
- `reason` is surfaced to the model as the tool error. Inline `data` is not gated.
- Stored on `state.byod.sourceUrlValidator`.

## Layers

A new dataset has **no layers** (unless your app's `addDataset` passed some) and renders nothing. The model picks them from
the profile with `setByodLayers` — its only way to make a dataset visible: graduate `circle-radius` by a number, colour a `fill` / `line` by category, switch points to
`symbol`, …

- `type` must suit the geometry: points → `circle` / `symbol` / `heatmap`, lines → `line`, polygons → `fill` / `fill-extrusion`.
- On a shown dataset the new layers apply live; `show` renders a hidden one or re-fits the camera.
- An invalid spec is rejected with a semantic error and the previous layers stay.

### Layer placement (`beforeID`)

A style layer id to draw **below**; omit for the top. Prefer the SDK's `mapStyleLayerIDs` anchors, as raw names (the
schema is a plain string): `'Borders - Treaty label'` (`lowestLabel`) for fill / line / heatmap so labels stay above,
`'Tunnel - Railway outline'` (`lowestRoadLine`) when roads should paint over a fill; omit for points.
An id absent from the current style puts the layer on top.

## Disabling BYOD

```ts
createMapAgent(map, {
    model,
    datasets: {
        byod: { enabled: false }, // drops byod from analyseDatasets / deriveDatasets and updateDatasetDisplay's slices,
                                  // and removes addByodSource / setByodLayers
    },
});
```
