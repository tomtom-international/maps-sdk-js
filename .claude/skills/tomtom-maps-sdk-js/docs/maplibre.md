# MapLibre Tile Sources (TomTom SDK context)

The TomTom SDK provides the basemap — vector tiles, style, glyphs, and sprites are all handled automatically. You access MapLibre directly via `map.mapLibreMap` to add your own data sources and layers on top.

## Accessing MapLibre

```ts
import maplibre from 'maplibre-gl';

// Always use map.mapLibreMap for direct MapLibre access
const mapLibreMap = map.mapLibreMap;
```

Wait for the map to be ready before adding sources/layers:

```ts
mapLibreMap.on('load', () => {
  mapLibreMap.addSource('my-data', { type: 'geojson', data: myGeoJSON });
  mapLibreMap.addLayer({ id: 'my-layer', type: 'circle', source: 'my-data' });
});
```

---

## Source types

| Type         | Best for                                                        |
| ------------ | --------------------------------------------------------------- |
| `geojson`    | Your own data — points, lines, polygons; no tile server needed  |
| `vector`     | Large datasets or zoom-dependent overlays (PMTiles, tile server)|
| `raster`     | Satellite imagery, WMS/WMTS, weather radar                      |
| `raster-dem` | Terrain / hillshade (TomTom SDK: use `HillshadeModule` instead) |

---

## GeoJSON sources

Inline object or URL to a `.geojson` file. The entire file is downloaded and rendered client-side — no tile server needed.

```ts
mapLibreMap.addSource('stores', {
  type: 'geojson',
  data: {
    type: 'FeatureCollection',
    features: [ /* ... */ ]
  }
});

// Or from a URL
mapLibreMap.addSource('stores', { type: 'geojson', data: '/data/stores.geojson' });
```

### Update GeoJSON data at runtime

```ts
const source = mapLibreMap.getSource('stores') as maplibre.GeoJSONSource;
source.setData(updatedGeoJSON);
```

### Performance thresholds

| Range      | File size / features             | Behavior                                                          |
| ---------- | -------------------------------- | ----------------------------------------------------------------- |
| Sweet spot | < 2 MB / < 5,000 features        | Instantaneous loading, smooth interaction                         |
| Lag zone   | 5–20 MB / ~50,000 features       | 1–3 s parse delay; simplify geometries, reduce coordinate precision |
| Crash zone | > 50 MB / > 100,000 features     | Switch to vector tiles                                            |

---

## Layer z-order — inserting below TomTom labels

Layers are drawn bottom-to-top. To keep TomTom road labels and POI icons visible above your overlay, insert your layer **before the first symbol layer**:

```ts
const firstSymbolId = mapLibreMap.getStyle().layers.find(l => l.type === 'symbol')?.id;

mapLibreMap.addLayer(
  { id: 'my-fill', type: 'fill', source: 'my-data', paint: { 'fill-color': '#0080ff', 'fill-opacity': 0.4 } },
  firstSymbolId  // insert before labels; omit to draw above everything
);
```

For points (circles/markers) you usually want them above labels — omit `beforeId`.

---

## Common layer types

```ts
// Circle (points)
mapLibreMap.addLayer({
  id: 'points', type: 'circle', source: 'my-data',
  paint: { 'circle-radius': 8, 'circle-color': '#e74c3c' }
});

// Line
mapLibreMap.addLayer({
  id: 'route', type: 'line', source: 'my-data',
  layout: { 'line-join': 'round', 'line-cap': 'round' },
  paint: { 'line-color': '#3498db', 'line-width': 4 }
});

// Fill (polygon)
mapLibreMap.addLayer({
  id: 'zone', type: 'fill', source: 'my-data',
  paint: { 'fill-color': '#2ecc71', 'fill-opacity': 0.3 }
}, firstSymbolId);

// Symbol (icon or text label)
mapLibreMap.addLayer({
  id: 'labels', type: 'symbol', source: 'my-data',
  layout: { 'text-field': ['get', 'name'], 'text-size': 12 }
});
```

---

## Vector tile overlays

For large datasets or zoom-dependent rendering, use a vector source pointing to a tile URL or TileJSON endpoint.

```ts
// From a TileJSON endpoint (preferred — MapLibre reads schema automatically)
mapLibreMap.addSource('my-tiles', {
  type: 'vector',
  url: 'https://example.com/tiles.json'
});

// From a tile URL template directly
mapLibreMap.addSource('my-tiles', {
  type: 'vector',
  tiles: ['https://example.com/tiles/{z}/{x}/{y}.pbf'],
  minzoom: 0,
  maxzoom: 14
});

// Layer must reference the correct source-layer name from the tile schema
mapLibreMap.addLayer({
  id: 'my-vector-layer',
  type: 'fill',
  source: 'my-tiles',
  'source-layer': 'parcels',       // must match tile schema exactly
  paint: { 'fill-color': '#f39c12', 'fill-opacity': 0.5 }
}, firstSymbolId);
```

### Serverless vector tiles (PMTiles)

Host a single `.pmtiles` file on static storage — MapLibre fetches only the byte ranges it needs via HTTP range requests, no tile server required. See the [PMTiles docs](https://docs.protomaps.com/pmtiles/) for setup.

---

## Raster tile overlays

```ts
mapLibreMap.addSource('satellite', {
  type: 'raster',
  tiles: ['https://example.com/wmts/{z}/{x}/{y}.png'],
  tileSize: 256,
  attribution: '© Provider'
});

mapLibreMap.addLayer({
  id: 'satellite-layer',
  type: 'raster',
  source: 'satellite',
  paint: { 'raster-opacity': 0.7 }
}, firstSymbolId);
```

---

## Runtime styling

Change paint and layout properties without recreating layers:

```ts
// Paint property (visual)
mapLibreMap.setPaintProperty('points', 'circle-color', '#e67e22');
mapLibreMap.setPaintProperty('zone', 'fill-opacity', 0.6);

// Layout property (geometry / text)
mapLibreMap.setLayoutProperty('labels', 'text-field', ['get', 'title']);
mapLibreMap.setLayoutProperty('route', 'visibility', 'none');  // hide a layer
mapLibreMap.setLayoutProperty('route', 'visibility', 'visible');
```

---

## Querying features

```ts
// Features visible in the current viewport (from specific layers)
const features = mapLibreMap.queryRenderedFeatures({ layers: ['points', 'zone'] });

// Features at a click position
mapLibreMap.on('click', 'points', (e) => {
  const feature = e.features?.[0];
  console.log(feature?.properties);
});

// All features in a source (regardless of visibility)
const allFeatures = mapLibreMap.querySourceFeatures('stores', {
  sourceLayer: 'stores'   // only needed for vector sources
});
```

---

## Style switching with TomTom

`map.setStyle()` replaces the TomTom style but **removes all custom sources and layers**. Re-add them after the new style loads:

```ts
map.mapLibreMap.once('style.load', () => {
  // Re-add your sources and layers here
  mapLibreMap.addSource('my-data', { type: 'geojson', data: myGeoJSON });
  mapLibreMap.addLayer({ id: 'my-layer', type: 'circle', source: 'my-data' });
});

map.setStyle('monoDark');
```

---

## Removing sources and layers

A source cannot be removed while layers still reference it — remove layers first:

```ts
mapLibreMap.removeLayer('my-layer');
mapLibreMap.removeSource('my-data');
```

---

## CORS

If your tile or GeoJSON files are on a different origin, the server must respond with `Access-Control-Allow-Origin`. Without this the browser blocks the request and the layer renders blank. Configure CORS on your CDN or server.

---

## References

- [MapLibre GL JS Map API](https://maplibre.org/maplibre-gl-js/docs/API/classes/Map/)
- [MapLibre Style Specification](https://maplibre.org/maplibre-style-spec/)
- [PMTiles](https://docs.protomaps.com/pmtiles/)
- [awesome-maplibre — Tile Providers & Servers](https://github.com/maplibre/awesome-maplibre#maptile-providers)
