# Map Styling Reference (StylingModule)

Semantic restyling of the base map, POIs and traffic overlays through **knobs** with stable ids. Prefer this over `map.mapLibreMap.setPaintProperty(...)` on base-map layers: knobs are validated, re-applied across `setStyle`, and re-verified by the SDK against the styles it ships with — raw layer ids are not a contract.

## Imports

```ts
import {
    StylingModule,
    type StylingKnobId,
    type StylingKnobDescriptor,
    type StylingSettings,
    type StylingColorKnobId,
    stylingKnobIds,
    stylingColorKnobIds,
} from '@tomtom-org/maps-sdk/map';
```

## Setup

```ts
const styling = await StylingModule.get(map);                       // shared per map
const styling = await StylingModule.get(map, { 'labels.sizeFactor': 1.2 }); // with initial settings
```

## Set / get / reset

```ts
styling.set('labels.sizeFactor', 1.3);       // factor 0.5–1.5, 1 = as the style ships
styling.set('symbols.sizeFactor', 1.2);      // icons: POI icons, shields, arrows
styling.set('roads.widthFactor', 0.8);       // road hierarchy kept
styling.set('roads.exitNumbers', false);     // toggle
styling.set('buildings.3d', true);           // toggle (ships hidden)
styling.set('pois.minZoom', 10);             // number 3–18
styling.set('pois.zoomShift', 1);            // number −3–3: + = sparser/later, − = denser/earlier
styling.set('pois.labelColor', '#ffffff');   // any CSS colour
styling.set('traffic.flow.slowColor', '#f59e0b'); // outline shade re-derived automatically

styling.get('roads.widthFactor');            // current value, or the style default
styling.reset('roads.widthFactor');          // one knob back to the style
styling.reset();                             // all knobs (same as resetConfig())
```

Invalid values throw `RangeError` naming the knob and its range; unknown ids throw `Error`. Nothing is touched on a failed call.

## Knob ids

| Group | Ids | Kind |
| --- | --- | --- |
| Labels & symbols | `labels.sizeFactor`, `symbols.sizeFactor` | factor 0.5–1.5 |
| Roads | `roads.widthFactor` | factor 0.5–1.5 |
| | `roads.exitNumbers`, `roads.shields`, `roads.arrows`, `roads.restricted`, `roads.underConstruction` | toggle |
| Buildings | `buildings.footprints`, `buildings.3d` | toggle |
| POIs | `pois.sizeFactor` (0.5–1.5), `pois.minZoom` (3–18), `pois.zoomShift` (−3–3) | factor / number |
| | `pois.labelColor`, `pois.labelOutlineColor` | color |
| | `pois.microMarkers` | toggle |
| Traffic flow | `traffic.flow.freeColor`, `traffic.flow.slowColor`, `traffic.flow.queueingColor`, `traffic.flow.stationaryColor`, `traffic.flow.closedColor` | color |
| | `traffic.flow.widthFactor` | factor 0.5–2 |
| Traffic incidents | `traffic.incidents.minorColor`, `traffic.incidents.moderateColor`, `traffic.incidents.majorColor`, `traffic.incidents.closedColor` | color |
| | `traffic.incidents.widthFactor` | factor 0.5–2 |
| Map colours | `colors.land`, `colors.water`, `colors.vegetation`, `colors.park`, `colors.artificial`, `colors.roadMajor`, `colors.road`, `colors.roadOutline`, `colors.label`, `colors.labelOutline` (see `setMapColors`) | color |
| Base-map groups | `basemap.land`, `basemap.water`, `basemap.roads`, `basemap.railways`, `basemap.ferries`, `basemap.borders`, `basemap.natureLabels`, `basemap.roadLabels`, `basemap.roadShields`, `basemap.houseNumbers`, `basemap.smallerTownLabels`, `basemap.stateLabels`, `basemap.cityLabels`, `basemap.allPlaceLabels`, `basemap.capitalLabels`, `basemap.countryLabels` (the two building groups are `buildings.footprints` / `buildings.3d` above) | toggle |
| Hillshade | `hillshade.method` | enum |
| | `hillshade.lightDirection` (0–359), `hillshade.exaggeration` (0–1), `hillshade.maxZoom` (10–22) | number |
| | `hillshade.shadowColor`, `hillshade.highlightColor`, `hillshade.accentColor` | color |
| View | `view.projection` (`'mercator'` \| `'globe'`) | enum |
| | `view.sky` | toggle |
| | `view.skyColor`, `view.horizonColor`, `view.spaceColor` | color |

Traffic knobs need the traffic style part loaded (`TrafficFlowModule.get(map, { visible: true })`) to show anything.

`stylingKnobIds` lists every id and `stylingColorKnobIds` (type `StylingColorKnobId`) the `color` ones, as constants needing no module: name a map colour through them rather than hard-coding it (the map-effects plugin's `bloom.only` takes them).

## Map colours — `setMapColors(colors)`

Ten semantic colours — Map Maker's Foundations, under its names and in its order. Partial objects OK. One name recolours every layer and shade derived from it (outlines, tunnels, bridges, trunk vs motorway) by the style's own HSL offsets — coherent, not a flat fill.

| Name | Map Maker | Reaches |
|---|---|---|
| `land` | Land (base) | Map background and bare land; influences admin borders/labels, and derives any colour left unset |
| `water` | Water | Waterbodies and waterways; also glaciers, water labels, ferry lines |
| `vegetation` | Vegetation | Forests, grass, shrubland; also earth cover at smaller scales |
| `park` | Park & Recreation | City parks and sport/recreation grounds; also National Parks and protected areas |
| `artificial` | Artificial | Built-up areas, landuse grounds, buildings; also railways |
| `roadMajor` | Major Road | Motorways, trunks, primary roads; also their outlines and tunnels |
| `road` | Road | Secondary/tertiary down to streets and service roads; also their tunnels |
| `roadOutline` | Road Outline | Outlines of secondary/tertiary and minor roads; also road labels and all other outlines |
| `label` | Label | Capital and other place/admin labels; also borders and all other label colours |
| `labelOutline` | Label Outline | Halos of place and admin labels; also border outlines and all other label halos |

```ts
import { type MapColors, mapColorNames } from '@tomtom-org/maps-sdk/map';
styling.setMapColors({ land: '#f3f5f7', water: '#accbe2', roadMajor: '#a1b8ce', label: '#364659' });
styling.get('colors.roadMajor');        // the style's base literal until set, e.g. 'hsl(47, 100%, 55%)'
styling.reset('colors.roadMajor');      // the colours are the `colors.*` knobs
styling.exportStyle();                  // StyleSpecification as rendered (knobs applied); tile URLs carry the API key
```

Prefer `setMapColors` over `setPaintProperty` on road/water/label layers: the recolour reaches ~150 layers' literals inside match/interpolate expressions and re-applies after `setStyle`.

A palette is a recolour, not an inversion — the offsets come off the loaded style. Keep it near that style's lightness; for a dark palette `await map.setStyle('standardDark')` first, then recolour, or the derived shades clamp and the road hierarchy washes out.

## Globe and sky — the `view` knobs

Map-level MapLibre state a `setStyle` would reset; owned here so it survives style switches.

```ts
styling.set('view.projection', 'globe');
styling.set('view.sky', true);              // without it a globe has NO atmosphere (MapLibre's default sky is transparent)
map.mapLibreMap.setMaxPitch(75);            // fog over a tilted view starts at pitch 60 = MapLibre's default maxPitch
```

3D terrain is **not** a knob — it needs the elevation style part loaded first, which `TerrainModule.get(map, { elevation: true })` does (see `map-setup.md` § TerrainModule).

The sky defaults follow `map.styleLightDarkTheme` — daylit blue + white horizon on a light style, night blue + dim horizon on a dark one. `view.skyColor` / `view.horizonColor` override; a style's own `sky` wins over both.

`view.spaceColor` is the colour **behind** the map, which a globe leaves visible around the planet. The map canvas is transparent there, so something has to fill it. A background your page already gives the map container is the knob's default and what `reset` returns to — the SDK does not paint over it. Otherwise it follows the theme (white on light, near-black on dark) and is re-applied after a `setStyle`, so a light→dark switch carries it.

Gotcha: the globe flattens to Mercator between zoom 11–12 by design.

## Presets — `applyPreset(id, { merge? })`

Named bundles of knob settings; `describe().presets` lists them with their settings.

| Preset | Intent |
| --- | --- |
| `'data-viz'` | quiet base under your data: smaller labels/icons, thinner roads, no badges, POIs from z14 |
| `'night-driving'` | bigger labels/shields, wider roads and traffic tubes, POIs from z13 |
| `'minimal'` | bare map: everything decorative off |
| `'globe'` | `view.projection: 'globe'` + `view.sky: true` |

```ts
styling.applyPreset('data-viz');                // replaces current settings
styling.applyPreset('globe', { merge: true });  // lays over current settings
```

Agent toolkit: `setMapStyling({ preset: 'data-viz' })`. For dimming/desaturating the base map itself, pair with the map-effects plugin (`map-effects.md`).

## The catalogue — `describe()`

Ground before generating: read what the loaded style actually exposes instead of guessing.

```ts
const { knobs } = styling.describe();
// knobs: StylingKnobDescriptor[] — { id, kind, description, default, current, overridden, range?, options?, available, appliesTo }
const sliders = knobs.filter((knob) => knob.available && (knob.kind === 'factor' || knob.kind === 'number'));
```

- `default` is the style's own value (`undefined` when the style uses a data-driven expression — `reset` still restores it).
- `available` is `false` when the knob has nothing to work on in the loaded style, so setting it would do nothing (the SDK also warns once). Filter on it before offering a knob.
- `appliesTo`: `'any-style'` knobs work anywhere, custom styles included (they wrap the style's own expressions); `'tomtom-styles'` knobs work on the TomTom styles this SDK version is verified against.

## Settings — persist / share / replay

```ts
const settings: StylingSettings | undefined = styling.getConfig(); // only overridden knobs, plain JSON
styling.applyConfig(settings);                                       // replace all knobs with these
styling.updateConfig(settings);                                      // set these, keep the other knobs
styling.events.on('config-change', (settings) => save(settings));   // fires after every set/reset/applyConfig/updateConfig
```

## Build a UI from the catalogue

```ts
// A drag fires `input` far faster than a restyle runs: coalesce to one set per frame, last value wins.
let pending: number | string | undefined;
let frame = 0;
const queue = (id: StylingKnobId, value: number | string) => {
    pending = value;
    if (!frame) {
        frame = requestAnimationFrame(() => {
            frame = 0;
            styling.set(id, pending as never);
        });
    }
};

for (const knob of styling.describe().knobs) {
    if (knob.kind === 'toggle') {
        checkbox.checked = knob.current === true;
        checkbox.onchange = () => styling.set(knob.id, checkbox.checked as never);
    } else if (knob.kind === 'color') {
        picker.oninput = () => queue(knob.id, picker.value);       // same story: the picker fires continuously
    } else {
        slider.min = String(knob.range!.min); slider.max = String(knob.range!.max); slider.step = String(knob.range!.step);
        slider.oninput = () => queue(knob.id, Number(slider.value));
        slider.onchange = () => styling.set(knob.id, Number(slider.value) as never);  // the released value always lands
    }
}
```

**Do not rebuild the panel from `config-change` when the change came from the panel.** `set` emits
the event, so rebuilding replaces the input the pointer is dragging and the control fights the drag.
Rebuild only on external changes (a `reset`, a `setStyle`, an agent) — keep a flag around your own
`set` calls and skip the rebuild while it is up. `examples/map-styling-playground` does both.

## Base-map groups and hillshade as knobs

- `basemap.<group>` toggles for the BaseMapModule groups (`basemap.roadLabels`, `basemap.water`, …) — one catalogue for all visibility, and `setMapStyling` is the agent tool for them. The two building groups are the `buildings.footprints` / `buildings.3d` knobs, not `basemap.*` ids.
- `hillshade.method` (`standard|basic|igor|combined|multidirectional`), `hillshade.lightDirection` (0–359, 335 = default), `hillshade.exaggeration` (0–1), `hillshade.maxZoom` (10–22), `hillshade.shadowColor|highlightColor|accentColor`. Show the shading first: `TerrainModule.get(map, { hillshade: true })` (see `map-setup.md` § TerrainModule). **Standard styles ramp exaggeration to 0 and stop at zoom 13** → at city zoom set `hillshade.exaggeration: 0.5` and `hillshade.maxZoom: 22` to see anything.

## Advanced tier — `styling.layers.query(...)` (version-coupled)

```ts
styling.layers.query({ group: 'roadLabels' }).setPaint({ 'text-color': '#93c5fd' });        // by base-map group
styling.layers.query({ metadataGroups: ['water'], layerTypes: ['fill'] }).setPaint({ 'fill-opacity': 0.6 });
styling.layers.query({ idIncludes: ['railway'] }).setVisible(false).setLayout({ 'line-cap': 'round' });
styling.layers.query({ sourceLayers: ['poi'] }).setFilter(['==', ['get', 'group'], 'transport']);
styling.layers.query({ group: 'roadLabels' }).reset();                                       // undo those edits
styling.layers.query({ group: 'railways' }).layerIds;                                        // what matched, in draw order
```

Every constraint given must hold, so the other fields narrow `group`. `setPaint`/`setLayout` take MapLibre's typed paint/layout properties; `setFilter` replaces the style's own filter, and module filters (POI categories, traffic) still narrow it. Re-applied after `setStyle` while the layers exist; dropped on `resetState: true`; **not** in `getConfig()`. Layer ids/expressions belong to the style version — prefer knobs/`setMapColors` where they cover the intent. An empty match warns once.

## Gotchas

- Settings survive `map.setStyle(style)` (re-applied last, after the other modules restore) and are dropped by `setStyle(style, { resetState: true })`.
- Module boundaries: `StylingModule` owns *how the style draws* every style part (base map, traffic tiles, POIs, hillshade, projection and sky); `BaseMapModule` / `TrafficFlowModule` / `TrafficIncidentsModule` / `POIsModule` / `TerrainModule` own *what is shown* (visibility, category filters, hillshade and 3D elevation) of one part each. Look for appearance knobs on `StylingModule`, never on the per-part modules.
- Toggles and `BaseMapModule.setVisible` / `POIsModule.setVisible` both write layer visibility: the later call wins.
- `pois.zoomShift` rewrites the POI layer filter that `POIsModule.filterCategories` also narrows; the two compose, in either order.
- Knobs never touch the SDK's own overlays (PlacesModule pins, routes, geometries, BYOD) — those have their own display config.
- `symbols.sizeFactor` and `labels.sizeFactor` both reach POI layers, as does `pois.sizeFactor`; factors on the same property multiply.
- Agent toolkit: the same catalogue is the `describeMapStyling` / `setMapStyling` tools (see `agent-toolkit/tools.md`).
