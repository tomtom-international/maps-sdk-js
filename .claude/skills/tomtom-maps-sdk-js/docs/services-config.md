# Services Configuration Reference

## Imports

```ts
import { TomTomConfig } from '@tomtom-org/maps-sdk/core';
```

---

## Global configuration

Set once at startup — all service calls and maps inherit these settings:

```ts
TomTomConfig.instance.put({
    apiKey: 'YOUR_API_KEY',
    language: 'en-GB',
});

// Update at runtime (shallow merge)
TomTomConfig.instance.put({ language: 'fr-FR' });

// Read current config
const { language } = TomTomConfig.instance.get();

// Reset to defaults (clears apiKey)
TomTomConfig.instance.reset();
```

`commonBaseURL` (default `https://api.tomtom.com`) is only for routing every request through your own proxy; leave `apiKey` unset as well for proxy-credentials mode, where the proxy injects the key. See [Proxying your API calls](https://docs.tomtom.com/maps-sdk-js/guides/security/proxying-api-calls).

---

## Per-call overrides

Any service call accepts these overrides:

```ts
// Override API key for a specific call
const results = await discoverPlaces({
    query: 'restaurants',
    apiKey: process.env.TOMTOM_PREMIUM_API_KEY,
});

// Disable request validation (saves CPU when inputs are trusted)
await discoverPlaces({
    query: 'coffee',
    validateRequest: false,
});

// Cancel a superseded call (search-as-you-type, refetch on map move)
const controller = new AbortController();
await discoverPlaces({
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
await discoverPlaces({
    query: 'Eiffel Tower',
    onAPIRequest: (apiRequest) => {
        console.debug('→ Request:', apiRequest);
    },
    onAPIResponse: (apiRequest, apiResponse) => {
        console.debug('← Response:', apiResponse);
    },
});
```

`apiRequest` is `{ url, headers, data? }` (a bare `URL` for EV charging availability). Routing, places and traffic incident details send the API key as `headers['TomTom-Api-Key']`, not in the URL — redact it before logging. To route calls through a backend, set `commonBaseURL` / `customServiceBaseURL` rather than sending requests yourself.

---

## Error handling

Every rejection is an `SDKError`. HTTP failures are `SDKServiceError` (adds `.status`), and a
cancelled call is `SDKAbortError` (`name === 'AbortError'`, abort reason on `.cause`).

`SDKAbortError` carries no `.status`, so match it **before** any status check or a cancellation
reads as an unknown failure:

```ts
import { SDKAbortError, discoverPlaces } from '@tomtom-org/maps-sdk/services';

try {
    const results = await discoverPlaces({ query: 'coffee', position: [4.9, 52.4], signal });
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

**Tip:** Both `geocodeOne()` and `discoverOnePlace()` throw if no result — use `geocode()` / `discoverPlaces()` or wrap in try/catch when the query might not be found. Both take a query string or the params object minus `limit` — `discoverOnePlace({ query, geoBias, signal })`.
