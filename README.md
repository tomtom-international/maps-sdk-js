[//]: # ([![TomTom Logo]&#40;./tomtom-logo-big.svg&#41;]&#40;https://www.tomtom.com/&#41;)

# TomTom Maps SDK for JavaScript

[🎮 **Examples**](https://docs.tomtom.com/maps-sdk-js/examples/) |
[📖 **Documentation**](https://docs.tomtom.com/maps-sdk-js/introduction/overview) |
[📋 **API Reference**](https://docs.tomtom.com/maps-sdk-js/api-reference/index.html) |
[🐙 **GitHub**](https://github.com/tomtom-international/maps-sdk-js)

[![NPM Version](https://img.shields.io/npm/v/@tomtom-org/maps-sdk.svg)](https://www.npmjs.com/package/@tomtom-org/maps-sdk)

![SDK Examples Collage](https://raw.githubusercontent.com/tomtom-international/maps-sdk-js/main/sdk-examples-collage.png)

TomTom Maps SDK for JavaScript is a **JavaScript** library for building applications using [**TomTom** location maps and services](https://docs.tomtom.com/).

[//]: # ([![SDK Example Thumbnails]&#40;./sdk-examples-collage.png&#41;]&#40;https://docs.tomtom.com/maps-sdk-js/examples/&#41;)

It leverages the power of [MapLibre GL JS](https://github.com/maplibre/maplibre-gl-js) and [GeoJSON](https://geojson.org/)
to seamlessly integrate TomTom maps and services with convenient out-of-the-box support, while staying highly customizable and extensible.
<br/><br/>

## ⚠️ Public Preview Notice
We have released some capabilities in the Maps SDK under [Public Preview](https://docs.tomtom.com/legal/public-preview) to collect feedback from the community.
- While our goal is to keep the design of the interface stable, breaking changes will occur, particularly in the earlier versions.
- The versions will follow a 0.MAJOR.MINOR pattern for the time being.
- Stay tuned with our release `CHANGELOG.md` files.
<br/><br/>

## 🚀 Getting Started
```
npm i @tomtom-org/maps-sdk
```

## 🤖 AI Coding Agent Skill

Install the SDK skill for AI coding agents (Claude Code, Cursor, GitHub Copilot, Windsurf, and [many more](https://www.npmjs.com/package/skills#available-agents)) to get SDK-specific assistance in your coding agent:
```bash
npx skills add tomtom-international/maps-sdk-js --skill tomtom-maps-sdk-js
```

## How it works

The SDK is split into three cooperating bundles — **Map**, **Services**, and **Core**. Services call TomTom APIs and return typed [GeoJSON](https://geojson.org/) that Map modules consume directly. Core provides the shared config and types that bridge them. See [How the SDK Works](https://docs.tomtom.com/maps-sdk-js/guides/how-the-sdk-works) for a deeper dive.

```ts
import { TomTomConfig } from '@tomtom-org/maps-sdk/core';
import { TomTomMap, PlacesModule, RoutingModule } from '@tomtom-org/maps-sdk/map';
import { search, calculateRoute } from '@tomtom-org/maps-sdk/services';

// Configure once — all services and the map use this key
TomTomConfig.instance.put({ apiKey: 'YOUR_API_KEY' });

const map = new TomTomMap({ mapLibre: { container: 'map', center: [4.9, 52.4], zoom: 12 } });

// Services return GeoJSON — map modules consume it directly
const places = await PlacesModule.get(map);
places.show(await search({ query: 'coffee' }));

const routing = await RoutingModule.get(map);
routing.showRoutes(await calculateRoute({ locations: [[4.9, 52.4], [13.4, 52.5]] }));
```
<br/><br/>

## 📚 Documentation & Examples

- **[Live Examples](https://docs.tomtom.com/maps-sdk-js/examples/)** — try the SDK in your browser
- **[Getting Started](https://docs.tomtom.com/maps-sdk-js/introduction/overview)** — introduction and project setup
- **[API Reference](https://docs.tomtom.com/maps-sdk-js/reference/overview)** — complete API documentation
- **[Release Notes](https://docs.tomtom.com/maps-sdk-js/introduction/release-notes)** — what's new and breaking changes
<br/><br/>

## 📦 Bundles

| Bundle | Import path | Platforms |
|--------|-------------|-----------|
| **[Map](https://docs.tomtom.com/maps-sdk-js/guides/map/quickstart)** — interactive maps in [styles](https://docs.tomtom.com/maps-sdk-js/guides/map/map-styles), with [POIs](https://docs.tomtom.com/maps-sdk-js/guides/map/pois), [traffic](https://docs.tomtom.com/maps-sdk-js/guides/map/traffic), [places](https://docs.tomtom.com/maps-sdk-js/guides/map/places), [routes](https://docs.tomtom.com/maps-sdk-js/guides/map/routing) and [geometries](https://docs.tomtom.com/maps-sdk-js/guides/map/geometries) | `@tomtom-org/maps-sdk/map` | web |
| **[Services](https://docs.tomtom.com/maps-sdk-js/guides/services/quickstart)** — [GeoJSON](https://geojson.org/) services for [places](https://docs.tomtom.com/maps-sdk-js/guides/services/places/quickstart), [routing](https://docs.tomtom.com/maps-sdk-js/guides/services/routing/quickstart), geocoding and more | `@tomtom-org/maps-sdk/services` | web, Node.js, React Native |
| **[Core](https://docs.tomtom.com/maps-sdk-js/api-reference/core)** — shared config, types and utilities; no separate install needed | `@tomtom-org/maps-sdk/core` | web, Node.js, React Native |

## 📄 License

This repository uses a **dual-licensing model**.

### SDK Packages and plugins - Proprietary License
The SDK packages (`@tomtom-org/maps-sdk/*` - core, services, map) and plugins (`@tomtom-org/maps-sdk-plugin-*`) are distributed under a **proprietary license**.

📜 **[LICENSE.txt](./LICENSE.txt)** - Full license terms

These packages require a TomTom API key and agreement to our terms of service.

### Examples - Apache V2.0 License
All example code in the `examples/` directory is **open-source** under the Apache V2.0 License.

📜 **[examples/LICENSE](./examples/LICENSE)** - Apache V2.0 License

The examples can be freely copied, modified, and used in your projects.

### Source-Available Repository
This repository is source-available for transparency and learning. This is a read-only mirror - see [CONTRIBUTING.md](./CONTRIBUTING.md) for how to provide feedback through issues and discussions.
