# Map Styles Reference

## Imports

```ts
import { TomTomMap, type StyleChangeHandler, type StandardStyleID, standardStyleIDs } from '@tomtom-org/maps-sdk/map';
```

---

## Available style IDs

`standardLight` (default), `standardDark`, `drivingLight`, `drivingDark`, `monoLight`, `monoDark`, `satellite`, `hybrid`

`standardStyleIDs` is a readonly array of all valid IDs — use it to populate a style picker without hardcoding.

---

## Setting a style

```ts
// At construction
const map = new TomTomMap({
    mapLibre: { container: 'map' },
    style: 'standardDark',
});

// After construction — preserves all SDK module state by default
map.setStyle('monoDark');

// Clean reset — removes all SDK layers and modules
map.setStyle('standardLight', { keepState: false });

// With explicit style parts
map.setStyle({
    type: 'standard',
    id: 'standardLight',
    include: ['trafficFlow', 'trafficIncidents', 'hillshade'],
});
```

---

## Style change lifecycle — `addStyleChangeHandler`

Register a handler to react when a style transition begins or completes. Both callbacks are optional.

```ts
map.addStyleChangeHandler({
    onStyleAboutToChange: () => {
        // Before the style change — clean up layers, save state
    },
    onStyleChanged: () => {
        // After the new style is fully loaded — restore layers, update UI
    },
});
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

### Sync UI to the active style (e.g. dark-mode class)

```ts
map.addStyleChangeHandler({
    onStyleChanged: () => {
        const style = map.getStyle();
        const id = typeof style === 'string' ? style : style?.id ?? '';
        document.body.classList.toggle('dark-mode', id.toLowerCase().includes('dark'));
    },
});
```

### Async handlers

Both callbacks may be `async`; the SDK awaits each before proceeding:

```ts
map.addStyleChangeHandler({
    onStyleAboutToChange: async () => { await saveState(); },
    onStyleChanged:       async () => { await restoreState(); },
});
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
- Handlers only fire when `keepState: true` (the default). `keepState: false` skips all lifecycle callbacks.
- No `removeStyleChangeHandler` — handlers persist for the map's lifetime. Register only once (guard with a flag if needed).
- Multiple handlers run in registration order; a failing handler is caught and logged but does not block the rest.