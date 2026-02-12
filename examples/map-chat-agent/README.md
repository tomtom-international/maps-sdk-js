# Map Chat Agent Example

This example demonstrates the TomTom Maps SDK Map Agent plugin, which provides a conversational AI interface for controlling maps and accessing location services.

## Features

- **Conversational Interface**: Natural language chat to control the map
- **Location Search**: Find places, addresses, and POIs
- **Routing**: Calculate and display routes between locations
- **Map Controls**: Switch styles, toggle traffic, adjust POI visibility
- **Geocoding**: Convert between addresses and coordinates
- **Real-time Updates**: Map updates as you chat with the assistant

## Setup

1. Create a `.env` file in the `examples/` directory (copy from `.env.example`):
   ```bash
   cd examples
   cp .env.example .env
   ```

2. Edit the `.env` file and set your TomTom API key:
   ```
   API_KEY_EXAMPLES=your_tomtom_api_key
   ```

3. Set your Azure OpenAI credentials in the same `.env` file:
   ```
   AZURE_BASE_URL=https://your-resource.cognitiveservices.azure.com
   AZURE_API_KEY=your-azure-api-key
   AZURE_DEPLOYMENT_ID=model-router
   AZURE_API_VERSION=2024-12-01-preview
   ```
   
   Find these values in your [Azure Portal](https://portal.azure.com):
   - **AZURE_BASE_URL**: Your Azure OpenAI endpoint URL (without `/openai` suffix)
   - **AZURE_API_KEY**: One of the keys from "Keys and Endpoint" section
   - **AZURE_DEPLOYMENT_ID**: Your deployment name (e.g., "model-router", "gpt-4o")
   - **AZURE_API_VERSION**: API version (defaults to "2024-12-01-preview" if not set)

4. Install dependencies (requires AI SDK v6 and @ai-sdk/azure v3+):
   ```bash
   pnpm install
   ```

5. Run the example:
   ```bash
   pnpm develop
   ```

## Example Queries

Try asking the assistant:

- "Find restaurants near Trafalgar Square"
- "Show me a route from London Eye to Buckingham Palace"
- "Switch to satellite view"
- "Turn on traffic"
- "What's at coordinates -0.1276, 51.5074?"
- "Hide POIs and show only main roads"
- "Find charging stations along the route"

## How It Works

The Map Agent plugin combines:
- **TomTom Maps SDK**: Map rendering and modules (routing, places, etc.)
- **TomTom Services SDK**: Location APIs (geocode, search, routing)
- **Vercel AI SDK**: Multi-step agent execution with tool calling
- **Azure OpenAI**: Natural language understanding

The agent has 15 tools at its disposal:
- **Data tools**: geocode, reverseGeocode, searchPlaces, calculateRoute
- **Map tools**: showPlaces, showRoute, clearMap, flyTo, fitBounds, toggleTraffic, togglePOIs, setMapStyle, setLanguage, getViewport, toggleLayers

## Architecture

```
User Message → Agent → Tools → TomTom SDK → Map Updates
     ↑                                            ↓
     └────────── Assistant Response ──────────────┘
```

The agent maintains state across the conversation, allowing follow-up questions like:
- "Show those results on the map"
- "Now find gas stations along that route"
- "Zoom in on the first result"

## Notes

- The agent can handle multi-step tasks (e.g., search → show → zoom)
- Map state persists across queries
- Clear the conversation to reset the map and agent state
- The agent is location-aware and can work with your current viewport
