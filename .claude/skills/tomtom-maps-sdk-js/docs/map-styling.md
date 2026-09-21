# Map Styling Reference (StylingModule)

Semantic restyling of the base map, POIs and traffic overlays through **knobs** with stable ids. Prefer this over `map.mapLibreMap.setPaintProperty(...)` on base-map layers: knobs are validated, re-applied across `setStyle`, and re-verified by the SDK against the styles it ships with — raw layer ids are not a contract.

## Imports

```ts
import {
    StylingModule,
    type StylingKnobId,
    type StylingKnobDescriptor,
    type StylingSettings,
    stylingKnobIds,
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

Traffic knobs need the traffic style part loaded (`TrafficFlowModule.get(map, { visible: true })`) to show anything.

## The catalogue — `describe()`

Ground before generating: read what the loaded style actually exposes instead of guessing.

```ts
const { knobs } = styling.describe();
// knobs: StylingKnobDescriptor[] — { id, kind, description, default, current, overridden, range?, available, appliesTo }
const sliders = knobs.filter((knob) => knob.available && (knob.kind === 'factor' || knob.kind === 'number'));
```

- `default` is the style's own value (`undefined` when the style uses a data-driven expression — `reset` still restores it).
- `available` is `false` when the knob has nothing to work on in the loaded style, so setting it would do nothing (the SDK also warns once). Filter on it before offering a knob.
- `appliesTo`: `'any-style'` knobs work anywhere, custom styles included (they wrap the style's own expressions); `'tomtom-styles'` knobs work on the TomTom styles this SDK version is verified against.

## Settings — persist / share / replay

```ts
const settings: StylingSettings | undefined = styling.getConfig(); // only overridden knobs, plain JSON
styling.applyConfig(settings);                                       // replace all knobs with these
styling.events.on('config-change', (settings) => save(settings));   // fires after every set/reset/applyConfig
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

## Gotchas

- Settings survive `map.setStyle(style)` (re-applied last, after the other modules restore) and are dropped by `setStyle(style, { resetState: true })`.
- Module boundaries: `StylingModule` owns *how the style draws* every style part (base map, traffic tiles, POIs, hillshade, view state); `BaseMapModule` / `TrafficFlowModule` / `TrafficIncidentsModule` / `POIsModule` / `HillshadeModule` own *what is shown* (visibility, category filters) of one part each. Look for appearance knobs on `StylingModule`, never on the per-part modules.
- Toggles and `BaseMapModule.setVisible` / `POIsModule.setVisible` both write layer visibility: the later call wins.
- `pois.zoomShift` rewrites the POI layer filter that `POIsModule.filterCategories` also narrows; the two compose, in either order.
- Knobs never touch the SDK's own overlays (PlacesModule pins, routes, geometries, BYOD) — those have their own display config.
- `symbols.sizeFactor` and `labels.sizeFactor` both reach POI layers, as does `pois.sizeFactor`; factors on the same property multiply.
- Agent toolkit: the same catalogue is the `describeMapStyling` / `setMapStyling` tools (see `agent-toolkit/tools.md`).
