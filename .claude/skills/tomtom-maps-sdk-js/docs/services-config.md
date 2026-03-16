# Services Configuration Reference

## Imports

```ts
import { TomTomConfig } from '@tomtom-org/maps-sdk/core';
import { customizeService } from '@tomtom-org/maps-sdk/services';
```

---

## Global configuration

Set once at startup — all service calls and maps inherit these settings:

```ts
TomTomConfig.instance.put({
    apiKey: 'YOUR_API_KEY',
    language: 'en-GB',
    apiVersion: 1,
    commonBaseURL: 'https://api.tomtom.com',
});

// Update at runtime (shallow merge)
TomTomConfig.instance.put({ language: 'fr-FR' });

// Read current config
const { language } = TomTomConfig.instance.get();

// Reset to defaults (clears apiKey)
TomTomConfig.instance.reset();
```

---

## Per-call overrides

Any service call accepts these overrides:

```ts
// Override API key for a specific call
const results = await search({
    query: 'restaurants',
    apiKey: process.env.TOMTOM_PREMIUM_API_KEY,
});

// Disable request validation (saves CPU when inputs are trusted)
await search({
    query: 'coffee',
    validateRequest: false,
});

// Custom timeout
await calculateRoute({
    locations: [[4.9, 52.4], [2.3, 48.8]],
    timeout: 15000,  // ms
});
```

---

## Lifecycle hooks

Observe outgoing requests and raw responses without modifying them — useful for debugging, logging, analytics:

```ts
await search({
    query: 'Eiffel Tower',
    onAPIRequest: (apiRequest) => {
        console.debug('→ Request:', apiRequest);
    },
    onAPIResponse: (apiRequest, apiResponse) => {
        console.debug('← Response:', apiResponse);
    },
});
```

---

## Error handling

```ts
try {
    const results = await search({ query: 'coffee', position: [4.9, 52.4] });
} catch (error) {
    switch (error.status) {
        case 400: console.error('Bad request — check parameters'); break;
        case 401: console.error('Invalid API key'); break;
        case 403: console.error('API key lacks required permissions'); break;
        case 429: console.error('Rate limit — implement exponential backoff'); break;
        default:  console.error('Service error:', error.message);
    }
}
```

**Tip:** `geocodeOne()` throws if no result — use `geocode()` or wrap in try/catch when the address might not be found. `searchOne()` returns `undefined` instead of throwing.

---

## Advanced: `customizeService`

For low-level request/response control — use only when standard options are insufficient:

```ts
import { customizeService } from '@tomtom-org/maps-sdk/services';

// Build a request without sending it (e.g. to proxy through your backend)
const { buildGeocodingRequest } = customizeService.geocode;
const url = buildGeocodingRequest({ apiKey: 'YOUR_API_KEY', query: 'Amsterdam' });
const rawResponse = await fetch(url);

// Parse a raw API response into SDK GeoJSON
const { parseGeocodingResponse } = customizeService.geocode;
const parsedData = parseGeocodingResponse(await rawResponse.json());
```

Available on: `customizeService.geocode`, `customizeService.reverseGeocode`, `customizeService.calculateRoute`, `customizeService.reachableRange`, `customizeService.geometrySearch`, `customizeService.geometryData`, `customizeService.placeByID`, `customizeService.autocompleteSearch`, `customizeService.evChargingStationsAvailability`, `customizeService.trafficAreaAnalytics`, `customizeService.trafficIncidentDetails`.

Use cases: custom API gateways, proxies, non-standard endpoints, testing, or adapting to pre-release API versions.
