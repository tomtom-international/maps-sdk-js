import { TomTomConfig } from '@tomtom-org/maps-sdk/core';
import { type GeocodingParams, geocodeOne, SDKError, SDKServiceError } from '@tomtom-org/maps-sdk/services';
import { API_KEY } from './config';

// A rate-limited (429) call is retried for up to 5 seconds before it rejects with RATE_LIMITED.
TomTomConfig.instance.put({ apiKey: API_KEY, retry: { timeoutMs: 5000 } });

const batch: Omit<GeocodingParams, 'limit'>[] = [
    { query: 'Damrak 1, Amsterdam' },
    { query: 'Rue de Rivoli 99, Paris', filters: { countries: ['FR'] } },
    { query: 'Marunouchi 1-1, Tokyo', geoBias: { position: [35.68, 139.76] } }, // latitude first by mistake
    { query: 'Unter den Linden 77, Berlin' },
    { query: 'qzxqzxqzx' },
    { query: 'Plaza Mayor, Madrid' },
];

const describeFailure = (error: unknown) => {
    if (!(error instanceof SDKError)) return `not an SDKError: ${error instanceof Error ? error.message : error}`;

    const origin = error instanceof SDKServiceError ? `the API answered ${error.status}` : 'raised by the SDK';
    const detail =
        error.issues?.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join('; ') ?? error.message;
    return `${error.code}, ${origin}, canRetry ${error.canRetry} (${detail})`;
};

(async () => {
    const signal = AbortSignal.timeout(10000);
    const results = await Promise.allSettled(batch.map((request) => geocodeOne({ ...request, signal })));

    results.forEach((result, index) => {
        const { query } = batch[index];
        if (result.status === 'fulfilled') {
            const { geometry, properties } = result.value;
            console.log(`OK    ${query}: ${properties.address.freeformAddress} [${geometry.coordinates}]`);
        } else {
            console.log(`FAIL  ${query}: ${describeFailure(result.reason)}`);
        }
    });
})();
