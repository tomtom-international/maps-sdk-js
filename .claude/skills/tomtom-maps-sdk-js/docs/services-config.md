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

// Cancel a superseded call (search-as-you-type, refetch on map move)
const controller = new AbortController();
await search({
    query: 'coffee',
    signal: controller.signal,
});

// There is no `timeout` option — compose a deadline onto the signal instead
await calculateRoute({
    locations: [[4.9, 52.4], [2.3, 48.8]],
    signal: AbortSignal.any([controller.signal, AbortSignal.timeout(15000)]),
});
```

Aborting cancels the in-flight HTTP request, including while the SDK waits to retry a `429`.
An already-aborted signal rejects before any request is sent.

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

Every rejection is an `SDKError`. HTTP failures are `SDKServiceError` (adds `.status`), and a
cancelled call is `SDKAbortError` (`name === 'AbortError'`, abort reason on `.cause`).

`SDKAbortError` carries no `.status`, so match it **before** any status check or a cancellation
reads as an unknown failure:

```ts
import { SDKAbortError, search } from '@tomtom-org/maps-sdk/services';

try {
    const results = await search({ query: 'coffee', position: [4.9, 52.4], signal });
} catch (error) {
    if (error instanceof SDKAbortError) return; // superseded, not a failure

    switch (error.status) {
        case 400: console.error('Bad request — check parameters'); break;
        case 401: console.error('Invalid API key'); break;
        case 403: console.error('API key lacks required permissions'); break;
        case 429: console.error('Rate limit — implement exponential backoff'); break;
        default:  console.error('Service error:', error.message);
    }
}
```

**Tip:** Both `geocodeOne()` and `searchOne()` throw if no result — use `geocode()` / `search()` or wrap in try/catch when the query might not be found. They take a bare query string, so they cannot be cancelled; use `search()` / `geocode()` with a `signal` when you need that.

---

## Advanced: `customizeService`

For low-level request/response control — use only when standard options are insufficient:

```ts
import { isProxyCredentialsMode, mergeFromGlobal } from '@tomtom-org/maps-sdk/core';
import { customizeService } from '@tomtom-org/maps-sdk/services';

// Build a request without sending it (e.g. to proxy through your backend).
// Builders expect the global config merged in and return `{ url, headers }`:
// the API key travels in `headers`, not in the URL.
const { buildGeocodingRequest, parseGeocodingResponse } = customizeService.geocode;
const config = mergeFromGlobal({ query: 'Amsterdam' });
const { url, headers } = buildGeocodingRequest(config);

// Pass `headers` on or the request is unauthenticated. With a credentials proxy
// (no `apiKey`, custom `commonBaseURL`) send the session cookie instead, like the SDK does.
const rawResponse = await fetch(url, {
    headers,
    ...(isProxyCredentialsMode(config) && { credentials: 'include' }),
});

// Parse a raw API response into SDK GeoJSON
const parsedData = parseGeocodingResponse(await rawResponse.json());
```

Available on: `customizeService.geocode`, `customizeService.reverseGeocode`, `customizeService.calculateRoute`, `customizeService.reachableRange`, `customizeService.geometrySearch`, `customizeService.geometryData`, `customizeService.placeByID`, `customizeService.autocompleteSearch`, `customizeService.evChargingStationsAvailability`, `customizeService.trafficAreaAnalytics`, `customizeService.trafficIncidentDetails`.

Use cases: custom API gateways, proxies, non-standard endpoints, testing, or adapting to pre-release API versions.
