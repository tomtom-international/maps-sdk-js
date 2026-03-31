# Map Agent Tools

This directory contains all the tools available to the TomTom Map Agent, organized by category.

## Directory Structure

### 📁 `utilities/`
**Pure functions that calculate values**

Utility tools that perform calculations without side effects or external API calls. These tools are stateless and deterministic.

- `format-distance` - Format a distance in meters into human-readable strings (e.g., "2.5 km", "1½ mi")
- `format-duration` - Format a duration in seconds into human-readable time strings (e.g., "2 hr 30 min")

### 📁 `services/`
**SDK services without map display**

Tools that call TomTom SDK services to retrieve data but don't modify the map visualization. These are pure data fetching operations.

- `geocode` - Convert addresses to coordinates
- `reverse-geocode` - Convert coordinates to addresses
- `discover-places` - Discover places and POIs
- `locate-place` - Resolve one location string for downstream workflows
- `calculate-route` - Calculate routes between locations
- `add-stop-to-route` - Add a stop to an existing route and re-calculate it
- `remove-stop-from-route` - Remove a stop from an existing route by index and re-calculate it
- `get-last-search-results` - Get the most recent search results from the last search service call
- `get-last-routes` - Get the most recent routes from the last route calculation service call
- `get-last-geocoded-result` - Get the most recent geocoded location from the last geocoding service call
- `get-last-reverse-geocoded-result` - Get the most recent reverse geocoded address from the last reverse geocoding service call
- `get-last-places` - Get the most recent places (from search, geocode, or reverse geocode) from the last service call

### 📁 `tomtom-map/`
**TomTom map display operations**

Tools that control the TomTom map visualization, including showing data, toggling features, and managing the map state.

- `show-places` - Display the most recent search results as markers on the map
- `show-route` - Display the most recent calculated route on the map
- `get-places-history` - Page or filter stored places from prior search/geocode results without refetching
- `get-route-history` - Page stored route calculations, with truncation for alternative routes and optional stored waypoints
- `get-current-waypoints` - Read staged waypoint slots for the next route calculation
- `get-shown-places` - Get the places currently displayed on the map
- `get-shown-routes` - Get the routes currently displayed on the map
- `get-shown-waypoints` - Get the route waypoints currently displayed on the map
- `get-shown-route-traffic-incidents` - Get the route traffic incidents currently displayed on the map
- `clear-map` - Remove displayed features from the map (places, routes, geometries)
- `fly-to` - Move the map camera to a specific location with animation
- `fit-bounds` - Fit the map camera to show a specific bounding box or GeoJSON features
- `fit-route-section` - Fit the map camera to show a specific section of a displayed route
- `get-viewport` - Get the current map viewport information (center, zoom, bounds)
- `get-standard-map-styles` - Get the list of available standard map style IDs
- `set-language` - Change the language of map labels
- `set-map-standard-style` - Change the map visual theme to a standard preset. For detailed tweaking use `getMapStyleLayers`, `setLayoutProperties`, `setPaintProperties`.
- `toggle-base-map-layer-groups` - Show or hide specific base map layer groups (buildings, roads, labels, etc.)
- `toggle-pois` - Show or hide built-in map POI icons with optional category filtering
- `toggle-traffic-flow` - Show or hide the real-time traffic flow layer
- `toggle-traffic-incidents` - Show or hide the real-time traffic incidents layer

### 📁 `maplibre/`
**MapLibre-specific features**

Advanced tools for direct MapLibre GL manipulation, including style inspection and property updates.

- `get-map-style-layers` - Get layer IDs with their layout/paint properties from MapLibre style
- `set-layout-properties` - Set one or more layout properties for MapLibre layers (visibility, text-field, icon-size)
- `set-paint-properties` - Set one or more paint properties for MapLibre layers (colors, widths, sizes)

## Adding New Tools

When adding a new tool:

1. **Choose the right category:**
   - `meta/` - For tool discovery and help
   - `utilities/` - For pure calculations
   - `services/` - For API/service calls without map changes
   - `tomtom-map/` - For map visualization operations
   - `maplibre/` - For low-level MapLibre GL features

2. **Create the tool file** in the appropriate subdirectory with:
   - A Zod schema for the tool parameters
   - A factory function that creates the tool using `dynamicTool()`

3. **Export from subdirectory index** (`<subdirectory>/index.ts`)
   - Export both the schema and the factory function

4. **Import in tool-registry.ts**
   - Add imports for the schema and factory function
   - Add an entry to the `TOOL_REGISTRY` object with complete metadata

The `DefaultToolSet` type is automatically derived from the `TOOL_REGISTRY` using mapped types, so no manual type updates are needed.

## Usage

All tools are exported from the main index file:

```typescript
import { createMapToolSet } from '@tomtom-org/maps-sdk-plugin-ai-agent';

const tools = createMapToolSet(context);

// Use individual tools
await tools.geocode.execute({ query: 'Amsterdam' });
await tools.formatDistance.execute({ meters: 1500 });
await tools.setLayoutProperties.execute({
  changes: [{ layerId: 'poi-labels', propertyName: 'visibility', value: 'none' }]
});
```

