# AGENTS.md - Examples

**Live examples demonstrating SDK features** - 50+ working examples showcasing maps, search, routing, and more.

## For External Developers (Using the SDK)

**👉 If you're a customer/user of the SDK:**

- **[View Live Examples](https://docs.tomtom.com/maps-sdk-js/examples/)** - Interactive examples you can test online
- **[Official Documentation](https://docs.tomtom.com/maps-sdk-js/)** - Complete SDK documentation
- **[Example Catalog](#example-catalog)** - See list of all available examples below

**Do not** use code from this repository directly - examples here are for SDK development. For production code, follow the official documentation above.

---

## For Contributors (Developing Examples)

This section is for developers working on the SDK examples codebase.

### Overview

This directory contains 50+ runnable examples demonstrating SDK features:
- Map display and interaction
- Search and geocoding
- Routing and navigation
- Traffic visualization
- Places and POI management
- Custom styling and theming

Each example is a standalone application you can run and modify.


### Development Setup

```bash
# From repo root
pnpm install
pnpm build

# Run an example in development mode
cd examples/<example-name>
pnpm develop
# Open browser to http://localhost:5173/<example-name>
```

See [../CONTRIBUTING.md](../CONTRIBUTING.md) for detailed setup.

### Creating a New Example
```bash
# Copy an existing example as template
cp -r default-map my-new-example

# Edit the files in my-new-example/
# - index.html - HTML structure
# - index.ts - TypeScript code
# - style.css - Custom styles (if needed)

# Test your example
pnpm dev
# Navigate to http://localhost:5173/my-new-example
```

### Testing SDK Changes
```bash
# 1. Make changes in ../map or ../services
cd ../map
pnpm build

# 2. Return to examples and test
cd ../examples
pnpm dev

# Examples automatically use the built SDK from workspace
```

### Example Structure
```
examples/
├── vite.config.ts          # Vite configuration for all examples
├── example-vite.config.ts  # Individual example config
├── default-map/            # Example: Basic map
│   ├── index.html
│   ├── index.ts
│   └── style.css (optional)
└── route/                  # Example: Routing
    ├── index.html
    └── index.ts
```

## Contributor Workflows

**Contributor wants to:**
- **Test new SDK feature** → Add example demonstrating the feature
- **Verify bug fix** → Run affected examples to validate fix
- **Document API usage** → Create example showing best practices
- **Generate thumbnails** → Run `pnpm generate-thumbnails` (see scripts)

## Example Catalog

### Map Basics
- **default-map** - Basic map initialization with styles, center, and zoom
- **map-language** - Display maps in different languages
- **keep-state-when-changing-style** - Maintain map state when switching styles

### Geometry & Data Visualization
- **basic-geometry** - Display simple geometries (points, lines, polygons)
- **multiple-geometries** - Show multiple geometric shapes on one map
- **byod-geojson-heatmap** - Create heatmaps from GeoJSON data
- **layer-group-toggling** - Toggle layer groups on/off
- **layer-groups-visibility-animation** - Animate layer visibility changes

### Search & Geocoding
- **geocode** - Convert addresses to coordinates (forward geocoding)
- **geocode-init** - Initialize map at geocoded location
- **reverse-geocode** - Convert coordinates to addresses
- **rev-geo-json** - Reverse geocode with full GeoJSON response
- **rev-geo-playground** - Interactive reverse geocoding playground
- **autocomplete-fuzzy-search-playground** - Search with autocomplete suggestions
- **search-parking** - Search for parking locations

### Geometry Search
- **geometry-search-playground** - Search within custom geometries
- **geometry-search-with-poi-categories** - Search for specific POI types in areas

### Routing
- **route** - Basic A-to-B routing and route visualization
- **route-with-alternatives** - Calculate and show alternative routes
- **route-with-guidance** - Turn-by-turn navigation instructions
- **route-multiple-origins** - Calculate routes from multiple starting points
- **route-multiple-origin-destinations** - Multiple origin and destination combinations
- **waypoints** - Routes with intermediate stops
- **route-reconstruction** - Reconstruct routes from GPS traces
- **route-monitor-traffic** - Routes considering live traffic
- **route-geometry-searches** - Find POIs along a route

### Routing Customization
- **route-custom-main-color** - Customize route line color
- **route-waypoint-icon-style** - Custom waypoint markers
- **route-maplibre-customization** - Advanced route styling with MapLibre

### EV Routing
- **ldevr-model-id** - EV routing with vehicle model
- **ldevr-detailed-vehicle** - Detailed EV parameters for routing
- **ldevr-custom-charging-stops** - Custom charging station preferences
- **reachable-ranges** - Calculate reachable area on single charge
- **ev-charging-stations-playground** - Find and display EV charging stations

### Places & POIs
- **places-customize-playground** - Customize place markers
- **places-default-icon-styling** - Default place icon styles
- **places-maplibre-customization** - Advanced place styling with MapLibre
- **places-multiple-icons-same-category** - Different icons for same category
- **places-in-geometry** - Display places within a defined area
- **poi-filters** - Filter POIs by category

### Interactions
- **pin-interaction** - Interactive map pins with click handlers
- **map-events** - Map interaction events (click, hover)
- **interactive-roads-and-numbers** - Interactive road highlighting
- **rest-of-the-map-click** - Detect clicks outside a known feature

### Traffic
- **traffic-flow** - Display traffic flow on roads
- **traffic-incidents** - Show traffic incidents and alerts
- **traffic-config-playground** - Configure traffic display options

### Map Configuration
- **map-config-playground** - Explore various map configuration options
- **load-style-parts** - Load specific style components

### Terrain
- **hillshade** - Display terrain with hillshading

### Node.js Examples
- **nodejs-geocode** - Server-side geocoding
- **nodejs-rev-geo** - Server-side reverse geocoding
- **nodejs-routing** - Server-side route calculation
- **nodejs-geometry-search** - Server-side geometry search

## Common Example Patterns

### Typical HTML Structure
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>Example Title</title>
  <link rel="stylesheet" href="maplibre-gl.css" />
  <style>
    #map { width: 100%; height: 100vh; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script type="module" src="./index.ts"></script>
</body>
</html>
```

### Typical TypeScript Structure
```typescript
import { TomTomConfig } from '@tomtom-org/maps-sdk/core';
import { TomTomMap } from '@tomtom-org/maps-sdk/map';
import 'maplibre-gl/dist/maplibre-gl.css';

TomTomConfig.instance.put({ apiKey: 'YOUR_API_KEY' });

async function main() {
  const map = new TomTomMap({
    container: 'map',
    center: [0, 0],
    zoom: 2
  });
  
  // Add example-specific logic here
}

main();
```

## Important Notes

- **Requires API key** - Set `apiKey` in examples (most use placeholder)
- **Hot reload** - Examples auto-reload when you edit code
- **Workspace packages** - Examples use local SDK build, not npm
- **Real APIs** - Examples make real API calls to TomTom services
- **Browser only** - These are web examples (for Node.js examples, see those prefixed with `nodejs-`)
- **Live examples online** - View at https://docs.tomtom.com/maps-sdk-js/examples/
