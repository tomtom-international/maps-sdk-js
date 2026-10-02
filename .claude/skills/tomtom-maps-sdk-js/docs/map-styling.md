# Map Styling Reference (StylingModule)

Semantic restyling of the base map, POIs and traffic overlays through **knobs** with stable ids. Prefer this over `map.mapLibreMap.setPaintProperty(...)` on base-map layers: knobs are validated, re-applied across `setStyle`, and re-verified by the SDK against the styles it ships with — raw layer ids are not a contract.

## Imports

```ts
import {
    StylingModule,
    type StylingKnobId,
    type StylingKnob,
    type StylingSettings,
    type StylingColorKnobId,
    stylingKnobIds,
    stylingColorKnobIds,
    stylingKnobCatalogue,
    stylingPresetCatalogue,
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
| Map colours | `colors.land`, `colors.water`, `colors.vegetation`, `colors.park`, `colors.artificial`, `colors.roadMajor`, `colors.road`, `colors.roadOutline`, `colors.label`, `colors.labelOutline`, `colors.accent` (see `setMapColors`) | color |
| Base-map groups | `basemap.land`, `basemap.water`, `basemap.roads`, `basemap.railways`, `basemap.ferries`, `basemap.borders`, `basemap.natureLabels`, `basemap.roadLabels`, `basemap.houseNumbers`, `basemap.smallerTownLabels`, `basemap.stateLabels`, `basemap.cityLabels`, `basemap.allPlaceLabels`, `basemap.capitalLabels`, `basemap.countryLabels` (the two building groups are `buildings.footprints` / `buildings.3d` above, and `roadShields` is `roads.shields`) | toggle |
| Hillshade | `hillshade.method` | enum |
| | `hillshade.lightDirection` (0–359), `hillshade.exaggeration` (0–1), `hillshade.maxZoom` (10–22) | number |
| | `hillshade.shadowColor`, `hillshade.highlightColor`, `hillshade.accentColor` | color |
| View | `view.projection` (`'mercator'` \| `'globe'`) | enum |
| | `view.sky` | toggle |
| | `view.skyColor`, `view.horizonColor`, `view.spaceColor` | color |

Traffic knobs need the traffic style part loaded (`TrafficFlowModule.get(map, { visible: true })`) to show anything.

`stylingKnobIds` lists every id and `stylingColorKnobIds` (type `StylingColorKnobId`) the `color` ones, as constants needing no module: name a map colour through them rather than hard-coding it (the map-effects plugin's `bloom.only` takes them).

### Borrowed looks

Knobs write only style layers, but some module parts read their look off the style and follow the knobs that restyle it — live, set before or after the module was created, and across `setStyle`. A setting given to the module wins.

| Module | Borrows | Follows | Own look instead |
| --- | --- | --- | --- |
| `PlacesModule`, `base-map` | POI labels and icons | `pois.labelColor`, `pois.labelOutlineColor`, `labels.sizeFactor`, `symbols.sizeFactor`, `pois.sizeFactor` | `label`, `layers` |
| `PlacesModule`, `circle-icon` / `pin-clustered` | POI icon size / micro markers | `symbols.sizeFactor`, `pois.sizeFactor` | `layers` |
| `RoutingModule` | `traffic` section delay colours; SDK colours while none is set | `traffic.incidents.minorColor`, `moderateColor`, `majorColor` | `line-color` under `layers.sections.traffic.routeIncidentBackgroundLine` |
| `TrafficIncidentOverlayModule` | incident colour per magnitude | `traffic.incidents.minorColor`, `moderateColor`, `majorColor`, `closedColor` | none |

`pin` places borrow nothing. Live demo: the `styling-borrowed-looks` example.

## Map colours — `setMapColors(colors)`

Ten semantic colours — Map Maker's Foundations, under its names and in its order — plus `accent`, which paints no base-map layer (`map-theming.md`). Partial objects OK: colours not given stay as drawn, except on `monoLight`/`monoDark`, which derive the other nine from `land` with the theme's formulas, so `setMapColors({ land })` alone recolours a mono map. One name recolours every layer and shade derived from it (outlines, tunnels, bridges, trunk vs motorway) by the style's own HSL offsets — coherent, not a flat fill.

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

Prefer `setMapColors` over `setPaintProperty` on road/water/label layers: the recolour reaches ~150 layers' literals inside match/interpolate expressions and re-applies after `setStyle`. Land-use and building tints of their own hue (education, healthcare, leisure, shopping) keep that hue, follow `artificial`'s lightness, and mute or regain saturation with its luminance, as the style's theme derives them. A pure grey map colour gives grey shades.

A palette is a recolour, not an inversion — the offsets come off the loaded style. Keep it near that style's lightness; for a dark palette `await map.setStyle('standardDark')` first, then recolour, or the derived shades clamp and the road hierarchy washes out.

When the look comes as a website, an image, a described palette or an artist's style rather than ten named colours, `styling.setMapColors(deriveMapColors([...]))` with the map-theme plugin assigns the roles for you, `colors.accent` included — see `map-theming.md`.

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

Named bundles of knob settings; `stylingPresetCatalogue` lists them with their settings.

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

## The catalogue — `stylingKnobCatalogue`

Static data, no map needed: the knob ids table above as code.

```ts
// stylingKnobCatalogue: readonly StylingKnob[] — { id, kind, description, range (factor/number), options (enum), appliesTo }
const sliders = stylingKnobCatalogue.filter((knob) => knob.kind === 'factor' || knob.kind === 'number');
styling.get('roads.widthFactor'); // the value in force on a live map
```

- Entries are `KnobEntry`s, shared with every module's catalogue (`map-setup.md` § Every setting as data); no `default`, the loaded style decides.
- `styling.get(id)` returns the override, or the loaded style's own value (`undefined` when the style uses a data-driven expression — `reset` still restores it).
- `appliesTo`: `'any-style'` knobs work anywhere, custom styles included (they wrap the style's own expressions); `'tomtom-styles'` knobs work on the TomTom styles this SDK version is verified against. On any other style, setting one warns once and does nothing.

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

for (const knob of stylingKnobCatalogue) {
    if (knob.kind === 'toggle') {
        checkbox.checked = styling.get(knob.id) === true;
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

- `basemap.<group>` toggles for the BaseMapModule groups (`basemap.roadLabels`, `basemap.water`, …) — one catalogue for all visibility, and `setMapStyling` is the agent tool for them. Each describes its group as `baseMapKnobCatalogue` does (`map-setup.md`). A group with a knob of its own has no `basemap.*` id: the two building groups are `buildings.footprints` / `buildings.3d`, and `roadShields` is `roads.shields`.
- `hillshade.method` (`standard|basic|igor|combined|multidirectional`), `hillshade.lightDirection` (0–359, 335 = default), `hillshade.exaggeration` (0–1), `hillshade.maxZoom` (10–22), `hillshade.shadowColor|highlightColor|accentColor`. Show the shading first: `TerrainModule.get(map, { hillshade: true })` (see `map-setup.md` § TerrainModule). **Standard styles ramp exaggeration to 0 and stop at zoom 13** → at city zoom set `hillshade.exaggeration: 0.5` and `hillshade.maxZoom: 22` to see anything. `hillshade.exaggeration` is shading strength only; "exaggerate the terrain" in 3D means `TerrainModule`'s `elevationExaggeration` / `setElevationExaggeration` (vertical scale, `map-setup.md`).

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
- Module boundaries: appearance of every style part is a knob here, never on the per-part modules; which module owns visibility, filters and data-owned layers is the *Who owns what* table in `map-setup.md`.
- The `basemap.<group>` / `buildings.*` / `roads.shields` toggles write through `BaseMapModule` and `get` reads the layers back, so `styling.get('basemap.water')` agrees with `baseMap.isVisible(…)` whichever you called. The later call wins, across `setStyle` too:
  - `baseMap.setVisible` over a group removes that group's toggle from `styling.getConfig()`.
  - A toggle set afterwards is re-applied over the base map's own restore.
- Toggles inside a module's layers only hide: `pois.microMarkers` (inside `POIsModule`), `roads.arrows`, `roads.restricted`, `roads.underConstruction`, `roads.exitNumbers` (inside `BaseMapModule`). `false` survives the module showing its layers again; `true` never shows them while the module hides them; unset leaves them as the module has them.
- `pois.zoomShift` rewrites the POI layer filter that `POIsModule.filterCategories` also narrows; the two compose, in either order.
- Knobs never write the SDK's own overlays (PlacesModule pins, routes, geometries, BYOD) — those have their own display config. The few parts that borrow a look from the style read it back and follow its knobs (§ Borrowed looks).
- `symbols.sizeFactor` and `labels.sizeFactor` both reach POI layers, as does `pois.sizeFactor`; factors on the same property multiply.
- Agent toolkit: the same knobs are the `setMapStyling` tool, whose schema names every id and range (see `agent-toolkit/tools.md`).
