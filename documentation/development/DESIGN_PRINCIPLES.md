# SDK Design Principles & Strategy

This document captures the technical design principles that guide the Maps SDK for JavaScript and the strategy through which we realize them. The principles describe what a successful SDK looks like; the strategy describes how we get there.

The strategy rests on a single guiding bet: **build on generic, open foundations rather than a proprietary stack.** The SDK renders through [MapLibre GL JS](https://maplibre.org/), a general-purpose open-source renderer, and models its data as [GeoJSON](https://geojson.org/), the de facto standard for geographic data on the web. Choosing these generic building blocks — a generic renderer and a generic data standard — over a closed, TomTom-specific design is what lets the SDK be two things that are usually in tension:

- **Accessible** — TomTom's maps and services work out of the box. Simple, TomTom-aware defaults hide the complexity of the underlying APIs and the renderer, so common use cases are easy.
- **Customizable** — the same generic foundations stay fully exposed underneath. Developers can drop down to raw MapLibre and plain GeoJSON to style, extend, and integrate their own data without fighting the SDK.

Everything below follows from this bet: the defaults make TomTom easy, and the open layers beneath keep it flexible.

## Design Principles

The SDK is a technical product built for external use. We consider it successful when it is:

- **User-friendly** — it adds value and simplifies use cases for developers in a consistent manner.
- **Flexible** — it is customizable and extensible.
- **Robust** — it is free of bugs within its own code.
- **High-performance** — it loads quickly and runs smoothly for end users.
- **Secure** — it introduces no security vulnerabilities to the integrating application or to the APIs it connects to.

### User-Friendly

The SDK is convenient when it adds significant value over calling the underlying APIs directly. Concretely, it should:

- Enable use cases:
    - Simplify common use cases out of the box.
    - Stay customizable for advanced use cases beyond the defaults.
- Conceal technical complexity and design flaws of the underlying APIs.
- Make its capabilities discoverable through thoughtful design and comprehensive documentation.
- Allow seamless adoption of newer versions while preserving backward compatibility.

### Flexible

Flexibility has two facets:

- **Customization** — developers can adjust behaviors and visuals beyond defaults.
- **Extensibility** — developers can layer their own data and features on top of what the SDK provides.

We strike a balance: flexibility must not get in the way of common use cases.

### Robust

The SDK must be stable and free of functional defects in its own code. Where helpful, it may also compensate for design flaws in underlying APIs or in the map renderer.

### High-Performance

Performance matters across several dimensions:

- **Downloading** — keep the SDK code compact and modular for efficient delivery.
- **Services** — execute call flows quickly; support async to avoid blocking.
- **Map initialization** — prioritize fast first-paint and time-to-interactive.
- **Map rendering** — keep frame budgets healthy.

### Secure

The SDK must not introduce vulnerabilities into the host application or the APIs it consumes.

## Design Strategy

How we deliver the principles above. The strategy is shaped by these principles and by the pain points identified in the previous SDK.

### User-Friendly

#### Abstraction over service APIs

- Use [**GeoJSON**](https://geojson.org/)-derived types wherever possible:
    - Unifies inconsistent API representations (e.g. multiple shapes for coordinates or polylines).
    - Maximizes compatibility with GIS tools.
    - Maximizes compatibility with MapLibre.
- **Merge overlapping APIs** into common services, with options selecting the underlying API call:
    - A single `search` service covers fuzzy, POI-category, and geometry search.
    - A single `routing` service covers standard and LDEVR routing depending on options.

#### TomTom-first map

Unlike general-purpose libraries that source map data from many origins, the Maps SDK JS prioritizes TomTom as its primary source while remaining open to non-TomTom data:

- Embraces the **TomTom Orbis** map as the primary integrated map.
- Explicitly recognizes and supports the available map styles.
- Ensures shapes render well against the supported TomTom styles by default.
- Provides straightforward style configuration and sensible user interactions over:
    - Well-organized layer groups aligned with Map Maker.
    - Additional TomTom map data such as POIs and traffic.

#### Easy map configuration

Map functionality can be configured in two ways:

- **Simple** — TomTom-aware configuration objects, sometimes theme-shaped, sometimes more detailed. These hide complexity and give quick options for the most common needs.
- **Advanced** — direct MapLibre access. See [Customization and extensibility on Map](#customization-and-extensibility-on-map).

#### Seamless integration between services and map

- Share [**GeoJSON**](https://geojson.org/)-derived types between services and map so that service output renders well on the map by default.
- Enhance map events to recognize service-rendered objects directly:
    - When a user interacts with service-rendered objects, it is trivial to trace them back to the originating service response.
    - Layering and priorities across multiple service integrations are managed by the SDK — developers do not need to reason about per-layer priorities.

#### Backward compatibility

Backward compatibility is essential for a good developer experience. The SDK guarantees backward compatibility across all minor versions following the first public release (1.0), and maximizes it across major releases.

### Flexible

#### Customization and extensibility on services

Each service supports **modifying request construction and response parsing**, enabling:

- Integrating third-party services alongside TomTom services in the host application.
- Custom response mappings to enrich service responses dynamically.
- Extending services with additional features — e.g. combining the search service with in-memory search and local-storage search history.
- Testing new API parameters that are not yet officially released.

#### Customization and extensibility on Map

The SDK Map exposes its own TomTom-focused features while also exposing the underlying [MapLibre GL JS `Map`](https://maplibre.org/maplibre-gl-js/docs/API/classes/Map/) directly. This unlocks the full MapLibre surface:

- Custom styling of service types, incrementally or from scratch.
- Runtime modifications to style properties.
- BYOD — adding sources and layers compliant with the Mapbox style spec.
- Querying layers and sources on the map.
- Custom event interactions on any layer of the map.

#### SDK plugins

Plugins extend the SDK using the SDK's own customization and extensibility — and existing web platforms and libraries. Both internal and external developers can publish plugins for use cases and integrations that fall outside the base SDK. Maintenance cost per plugin is intentionally low.

Some plugins expose existing SDK features through other platforms; others introduce new features, with or without third-party integrations. Examples:

- Framework integrations (React, Svelte, Angular, …).
- Smart UI components for search (search boxes).
- Smart UI components for route planning (stop inputs, avoid options, …).
- Fleet and logistics — optimal routes across multiple origins and destinations.
- Truck — routing and map with truck-optimized parameters.
- Driving ranges — time ranges from multiple locations, detecting covered and uncovered areas.
- EV charging — display of charging stations based on charging parameters.
- Figma integrations — embedding map snapshots and data into Figma designs.
- Multi-modal routing — blending walking, public transport, and driving cost models across providers.

### Robust

#### Functional testing

Functional tests run on every build to confirm features still work. The strategy follows the [testing pyramid](https://testsigma.com/blog/testing-pyramid/):

- **Unit tests** — pure functions; highest coverage per test.
- **Integration tests**:
    - Less combinatorial coverage than unit tests in general.
    - Cover service-to-API integration.
    - Cover map features against the real MapLibre renderer in the browser.
    - May still carry high coverage when mocked unit tests for the map would add little value or be cumbersome.
    - Must give confidence that TomTom data renders correctly and is interactive on the actual rendered map.
- **E2E tests**:
    - Full journeys involving service calls and map display.
    - Sanity checks with limited coverage, focused on confirming compatibility between services and the map.

### High-Performance

#### Bundle sizes

The SDK's bundle sizes must be monitored on every change so that only necessary code ships:

- Report and measure bundle sizes.
- Implement the SDK in a way that promotes [tree-shaking](https://developer.mozilla.org/en-US/docs/Glossary/Tree_shaking) in key areas:
    - Avoid large objects or classes unless necessary. Use classes only when there is state to keep (true of map objects).
- Use ES modules from third-party libraries to maximize tree-shaking.
- Do not export anything that does not need to be public.

#### Rely on and contribute to MapLibre

The SDK relies on MapLibre for map rendering — the hardest part of the stack.

- Monitor MapLibre releases for performance issues.
- Contribute improvements upstream when significant performance issues arise.

#### Performance testing

- Monitor execution times for services and map-loading stages.
- Introduce performance regression tests for service utilities so the SDK adds minimal overhead on API calls.
