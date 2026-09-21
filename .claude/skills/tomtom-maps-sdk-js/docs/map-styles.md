# Map Styles Reference

## Imports

```ts
import {
    TomTomMap,
    type StyleChangeHandler,
    type StyleChangeContext,
    type StandardStyleID,
    standardStyleIDs,
} from '@tomtom-org/maps-sdk/map';
```

---

## Available style IDs

`standardLight` (default), `standardDark`, `drivingLight`, `drivingDark`, `monoLight`, `monoDark`, `satellite`

`satellite` is imagery with the vector roads and labels drawn over it.

`standardStyleIDs` is a readonly array of all valid IDs — use it to populate a style picker without hardcoding.

---

## Setting a style

```ts
// At construction
const map = new TomTomMap({
    mapLibre: { container: 'map' },
    style: 'standardDark',
});

// After construction — carries all SDK module state over by default
map.setStyle('monoDark');

// Wait until the new style is loaded and every module has restored itself onto it
await map.setStyle('monoDark');

// Clean switch — modules re-bind with default config and nothing shown (the language is kept)
map.setStyle('standardLight', { resetState: true });

// With explicit style parts
map.setStyle({
    type: 'standard',
    id: 'standardLight',
    include: ['trafficFlow', 'trafficIncidents', 'hillshade'],
});

// Custom style (URL or inline JSON). Its light/dark theme is read from the loaded style.
map.setStyle({ type: 'custom', url: 'https://example.com/my-style.json' });

// Or declare the theme, and the SDK takes it at its word instead of reading the style
map.setStyle({ type: 'custom', url: 'https://example.com/midnight.json', lightDarkTheme: 'dark' });
```

`setStyle` returns `Promise<void>`. A second `setStyle` while one is in flight supersedes it: only the last style is applied, and both promises resolve. Passing the style already loaded runs the lifecycle without reloading it.

`resetState: true` is the way to clear the map: every module comes back bound to the new style with default configuration and nothing shown, so a reset is one call rather than a `clear()` per module. Reach for it when a conversation, a session or a view starts over — it is what the agent-toolkit `reset` tool does. Passing the style already loaded resets the modules over the current map, without reloading the style. The map language is configuration rather than state, so neither kind of switch touches it: only `setLanguage` changes it.

---

## Style change lifecycle — `addStyleChangeHandler`

Register a handler to react when a style transition begins or completes. Both callbacks are optional, may be `async`, and receive a `StyleChangeContext` (`{ resetState: boolean }`). `addStyleChangeHandler` returns an unsubscribe function.

```ts
const unsubscribe = map.addStyleChangeHandler({
    onStyleAboutToChange: (context) => {
        // Before the style change — clean up layers, save state
    },
    onStyleChanged: (context) => {
        // After the new style is fully loaded — restore layers, update UI
        if (context.resetState) return; // a clean switch: leave the map bare
    },
});

// When the handler's owner is torn down:
unsubscribe();
```

### Preserve custom MapLibre layers across style switches

Custom sources/layers added via `map.mapLibreMap` are wiped when the style changes — save and restore them:

```ts
import type { GeoJSONSource } from 'maplibre-gl';

let savedData: GeoJSON.FeatureCollection | null = null;

map.addStyleChangeHandler({
    onStyleAboutToChange: () => {
        const source = map.mapLibreMap.getSource('my-data') as GeoJSONSource | undefined;
        if (source) {
            savedData = source._data as GeoJSON.FeatureCollection;
            map.mapLibreMap.removeLayer('my-layer');
            map.mapLibreMap.removeSource('my-data');
        }
    },
    onStyleChanged: () => {
        if (!savedData) return;
        map.mapLibreMap.addSource('my-data', { type: 'geojson', data: savedData });
        map.mapLibreMap.addLayer({
            id: 'my-layer',
            type: 'circle',
            source: 'my-data',
            paint: { 'circle-radius': 6, 'circle-color': '#007cbf' },
        });
    },
});
```

Re-add with the same `beforeId` anchor — `mapStyleLayerIDs` values exist under the same IDs in every standard style, so the stacking is preserved (`mapStyleLayerIDs.lowestLabel` for lines and polygons; see `maplibre.md`). Or skip the handler entirely and use `CustomGeoJSONModule` (`custom.md`), which restores sources, layers, `beforeID` and data for you.

`resetState` governs the SDK modules, not your own layers. If your app also does clean switches, read `context.resetState` in `onStyleChanged` and drop the saved data instead of re-adding it — otherwise your layers survive a reset that cleared everything else.

### Sync UI to the active style (e.g. dark-mode class)

```ts
map.addStyleChangeHandler({
    onStyleChanged: () => {
        // Works for standard and custom styles: custom ones are classified once loaded.
        document.body.classList.toggle('dark-mode', map.styleLightDarkTheme === 'dark');
    },
});
```

### Async handlers

Both callbacks may be `async`. `onStyleAboutToChange` handlers finish before MapLibre receives the new style; the `setStyle` promise resolves after the last `onStyleChanged` handler:

```ts
map.addStyleChangeHandler({
    onStyleAboutToChange: async () => { await saveState(); },
    onStyleChanged:       async () => { await restoreState(); },
});
await map.setStyle('standardDark'); // both have run
```

---

## Style switcher UI

```ts
const select = document.querySelector('#style-select') as HTMLSelectElement;
standardStyleIDs.forEach(id => select.add(new Option(id, id)));
select.addEventListener('change', () =>
    map.setStyle(select.value as StandardStyleID)
);
```

---

## Gotchas

- `addStyleChangeHandler` only fires for `map.setStyle()` calls — **not** on initial map construction.
- For lower-level style lifecycle hooks (initial load, any style-related event), use `map.mapLibreMap.on('styledata', ...)` — see [MapLibre MapEventType](https://maplibre.org/maplibre-gl-js/docs/API/interfaces/MapEventType/).
- Handlers fire for a clean switch as well as for one that carries state over; read `context.resetState` to tell them apart. SDK modules reset to defaults on `true` and restore on `false`.
- Multiple handlers run in registration order, after the SDK modules; a failing handler is caught and logged but does not block the rest.
- `map.styleLightDarkTheme` is `'light'` for a custom style until it has loaded, then reflects the style's background colour. A custom style that declares `lightDarkTheme` reports that from the start.
- The SDK cannot add traffic/hillshade style parts to a custom style — `TrafficFlowModule.get(map)` on a custom style without a flow source throws. Build the custom style with those parts, or use a standard style.
