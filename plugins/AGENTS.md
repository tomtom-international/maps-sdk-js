
# AGENTS.md - Plugins

**Plugins** - SDK middlewares that extend the base SDK functionality with additional features and integrations.

## For External Developers (Using Plugins)

**👉 If you're a customer/user of the SDK looking to use plugins:**

- **[Official Documentation](https://docs.tomtom.com/maps-sdk-js/)** - Complete SDK documentation
- **[Plugin Registry](https://docs.tomtom.com/maps-sdk-js/plugins/)** - Available plugins and installation guides

**Do not** use instructions from this repository for plugin usage - always refer to official docs above.

---

## For Contributors (Developing Plugins)

This section is for developers creating new plugins for the SDK.

### Overview

Plugins are SDK middlewares that extend the base SDK functionality. They are designed as independent packages with the SDK as a peer dependency, allowing for separate release cycles and licensing.

### Plugin Architecture

Plugins follow these principles:

- **Peer Dependency**: Depend on the base SDK as a peer dependency
- **Independent Release**: Can be versioned and released separately from the core SDK
- **Flexible Licensing**: Can have their own license terms
- **Modular Design**: Add specific features without bloating the core SDK

### Plugin Categories

#### 1. Framework Integrations

Plugins that provide seamless integration with popular JavaScript frameworks:

- React components and hooks
- Angular services and directives
- Vue.js composables
- Svelte components

#### 2. Third-Party API Integrations

Plugins that connect external data sources and services:

- Place data providers
- Weather services
- Traffic information
- Multi-modal routing services
- LLM integrations for building conversational agents (e.g., ChatGPT, Claude)

#### 3. SDK Feature Extensions

Plugins that combine SDK capabilities:

- Viewport Places (existing plugin for map + search integration)
- Clustering and data visualization
- Advanced geocoding features
- Custom rendering engines

## Creating a Plugin

### Basic Structure

```
plugin-name/
├── src/
├── package.json
├── tsconfig.json
├── README.md
└── LICENSE
```

### Package Configuration

Ensure `package.json` includes:

```json
{
  "peerDependencies": {
    "@tomtom-org/maps-sdk": "^x.x.x"
  }
}
```

## Best Practices

- Keep plugins focused on a single responsibility
- Document public APIs thoroughly
- Include TypeScript type definitions
- Provide examples and integration guides
- Write comprehensive tests
- Follow semantic versioning

## Contributing

To contribute a new plugin, ensure it:

1. Adds meaningful functionality not present in the core SDK
2. Has clear documentation and examples
3. Includes appropriate tests
4. Follows the project's coding standards
5. Has a defined license
