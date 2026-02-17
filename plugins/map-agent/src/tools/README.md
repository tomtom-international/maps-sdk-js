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
- `search-places` - Search for places and POIs
- `calculate-route` - Calculate routes between locations

### 📁 `tomtom-map/`
**TomTom map display operations**

Tools that control the TomTom map visualization, including showing data, toggling features, and managing the map state.

- `show-places` - Display places on the map
- `show-route` - Display routes on the map
- `clear-map` - Clear all displayed data from the map
- `fly-to` - Animate map camera to a location
- `fit-bounds` - Fit map to show specific bounds
- `get-viewport` - Get current map viewport information
- `get-standard-map-styles` - Get list of available standard map style IDs
- `set-language` - Change map label language
- `set-map-style` - Change the map style
- `toggle-layers` - Show/hide specific map layers
- `toggle-pois` - Show/hide Points of Interest
- `toggle-traffic` - Show/hide traffic flow and incidents

### 📁 `maplibre/`
**MapLibre-specific features**

Advanced tools for direct MapLibre GL manipulation, including style inspection and property updates.

- `get-style-details` - Get detailed MapLibre style information
- `set-layout-property` - Update layout properties of map layers (e.g., visibility, text-field, icon-size)
- `set-paint-property` - Update paint properties of map layers (e.g., fill-color, line-width, text-color)

## Adding New Tools

When adding a new tool:

1. **Choose the right category:**
   - `utilities/` - For pure calculations
   - `services/` - For API/service calls without map changes
   - `tomtom-map/` - For map visualization operations
   - `maplibre/` - For low-level MapLibre GL features

2. **Create the tool file** in the appropriate subdirectory

3. **Export from subdirectory index** (`<subdirectory>/index.ts`)

4. **Import in main index** (`tools/index.ts`)

5. **Add to `DefaultToolSet` interface** and `createMapToolSet()` function

## Usage

All tools are exported from the main index file:

```typescript
import { createMapToolSet } from '@tomtom-org/maps-sdk-plugin-ai-agent';

const tools = createMapToolSet(context);

// Use individual tools
await tools.geocode.execute({ query: 'Amsterdam' });
await tools.formatDistance.execute({ meters: 1500 });
await tools.setLayoutProperty.execute({ 
  layerId: 'poi-labels', 
  propertyName: 'visibility', 
  value: 'none' 
});
```

