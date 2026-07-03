import type { Language } from '../types';
import type { DistanceUnitsType } from '../util';

/**
 * Configuration for displaying distance-based units.
 *
 * Allows customization of distance unit labels and the unit system
 * (metric or imperial) used throughout the SDK.
 *
 * @group Configuration
 */
export type DistanceDisplayUnits = {
    /**
     * Type of distance unit system.
     *
     * Determines whether to use metric (meters, kilometers) or
     * imperial (feet, miles, yards) units.
     */
    type?: DistanceUnitsType;
    /**
     * Custom label for kilometer units.
     *
     * @default "km"
     */
    kilometers?: string;
    /**
     * Custom label for meter units.
     *
     * @default "m"
     */
    meters?: string;
    /**
     * Custom label for mile units.
     *
     * @default "mi"
     */
    miles?: string;
    /**
     * Custom label for feet units.
     *
     * @default "ft"
     */
    feet?: string;
    /**
     * Custom label for yard units.
     *
     * @default "yd"
     */
    yards?: string;
};

/**
 * Configuration for displaying time-based units.
 *
 * Allows customization of time unit labels used for durations
 * throughout the SDK.
 *
 * @group Configuration
 */
export type TimeDisplayUnits = {
    /**
     * Custom label for hour units.
     *
     * @default "h"
     */
    hours?: string;
    /**
     * Custom label for minute units.
     *
     * @default "min"
     */
    minutes?: string;
};

/**
 * Display unit configuration for time and distance.
 *
 * Used by formatting utilities and map information displays to present
 * durations and distances with custom labels.
 *
 * @group Configuration
 */
export type DisplayUnits = {
    /**
     * Distance unit configuration.
     *
     * Controls how distances are displayed throughout the SDK.
     */
    distance?: DistanceDisplayUnits;
    /**
     * Time unit configuration.
     *
     * Controls how durations are displayed throughout the SDK.
     */
    time?: TimeDisplayUnits;
};

/**
 * Configuration for automatic retry behavior on rate-limited (429) responses.
 *
 * When a service request receives a 429 status code, the SDK will automatically
 * retry the request using exponential backoff. The `Retry-After` header from the
 * API response is respected when present.
 *
 * @example
 * ```typescript
 * TomTomConfig.instance.put({
 *   retry: {
 *     initialWaitMs: 0.447,
 *     backoffFactor: 1.618,
 *     timeoutMs: 60000,
 *   }
 * });
 * ```
 *
 * @group Configuration
 */
export type RetryConfig = {
    /**
     * Initial wait time in milliseconds before the first retry.
     *
     * Used as the base delay when no `Retry-After` header is present.
     *
     * @defaultValue 0.447
     */
    initialWaitMs?: number;

    /**
     * Multiplier applied to the wait time after each subsequent retry.
     *
     * For example, with `initialWaitMs: 0.447` and `backoffFactor: 1.618`,
     * wait times would be: 0.447ms, 0.723ms, 1.170ms, etc.
     *
     * @defaultValue 1.618
     */
    backoffFactor?: number;

    /**
     * Maximum total time in milliseconds to spend retrying before giving up.
     *
     * If the next retry wait would exceed this timeout (measured from the
     * first request), the SDK returns the 429 error to the caller.
     *
     * @defaultValue 60000
     */
    timeoutMs?: number;
};

/**
 * Global configuration for the TomTom Maps SDK.
 *
 * Contains essential parameters like API keys, language settings, and display preferences
 * that apply across all SDK services and map functionality.
 *
 * @remarks
 * This configuration can be set globally using {@link TomTomConfig} and will be merged
 * with service-specific configurations, with service configs taking precedence.
 *
 * @example
 * ```typescript
 * const config: GlobalConfig = {
 *   apiKey: 'your-api-key',
 *   apiVersion: 1,
 *   commonBaseURL: 'https://api.tomtom.com',
 *   language: 'en-US',
 *   displayUnits: {
 *     distance: { type: 'metric' },
 *     time: { hours: 'hrs', minutes: 'mins' }
 *   }
 * };
 * ```
 *
 * @group Configuration
 */
export type GlobalConfig = {
    /**
     * TomTom API key for authentication.
     *
     * Required for all SDK features. Obtain an API key from the
     * [my.tomtom.com](https://my.tomtom.com/).
     *
     * @default None (required)
     */
    apiKey: string;

    /**
     * An experimental alternative to the API Key which enables oauth2 access to APIs.
     * * If provided, then the API key parameter will be ignored.
     * @experimental
     */
    // TODO: restore if we implement oauth2 access
    // apiAccessToken?: string;

    /**
     * API version number for service endpoints.
     *
     * Each service may have its own default version. Consult the specific
     * service documentation for available versions.
     *
     * @default 1 (but each service can override)
     */
    apiVersion: number;

    /**
     * Request identifier for tracing and support.
     *
     * Must match the pattern: `^[a-zA-Z0-9-]{1,100}$`
     *
     * Recommended format is UUID (e.g., `9ac68072-c7a4-11e8-a8d5-f2801f1b9fd1`).
     * When specified, it's included in the `Tracking-ID` response header.
     * This is solely for support purposes and does not involve user tracking.
     *
     * @see {@link https://docs.tomtom.com/search-api/documentation/search-service/fuzzy-search#trackingid-response | Tracking-ID documentation}
     */
    trackingId?: string;

    /**
     * Language code for SDK services and map content.
     *
     * Accepts IETF language codes (case-insensitive). Affects search results,
     * routing instructions, and map labels.
     *
     * @default "NGT" (Neutral Ground Truth - uses local language for each location)
     *
     * @see {@link https://docs.tomtom.com/search-api/documentation/product-information/supported-languages | Search supported languages}
     * @see {@link https://docs.tomtom.com/routing-api/documentation/product-information/supported-languages | Routing supported languages}
     */
    language?: Language;

    /**
     * Base URL for all TomTom API services.
     *
     * Individual services can override this with their own base URLs.
     * Typically only changed for testing or enterprise deployments.
     *
     * @default "https://api.tomtom.com"
     */
    commonBaseURL: string;

    /**
     * Custom display units for time and distance.
     *
     * Applied to {@link formatDistance} and {@link formatDuration} utilities,
     * which are used throughout the SDK for displaying map information.
     * If not provided, default unit labels are used.
     */
    displayUnits?: DisplayUnits;

    /**
     * Configuration for automatic retry on rate-limited (429) responses.
     *
     * When set, the SDK automatically retries requests that receive a 429 status code
     * using exponential backoff. All fields have sensible defaults.
     *
     * @see {@link RetryConfig}
     */
    retry?: RetryConfig;
};

/**
 * Default base URL for TomTom APIs. A `commonBaseURL` other than this signals a
 * proxy or custom backend.
 *
 * @group Configuration
 */
export const DEFAULT_COMMON_BASE_URL = 'https://api.tomtom.com';

/**
 * Default global configuration values.
 *
 * Provides sensible defaults for the global configuration.
 * The API key must be set before using SDK features.
 *
 * @group Configuration
 */
export const defaultConfig: GlobalConfig = {
    commonBaseURL: DEFAULT_COMMON_BASE_URL,
    apiKey: '',
    apiVersion: 1,
    retry: {
        initialWaitMs: 0.447,
        backoffFactor: 1.618,
        timeoutMs: 40_000,
    },
};

/**
 * Global configuration singleton for the TomTom Maps SDK.
 *
 * Manages SDK-wide configuration settings that apply to all services and maps.
 * Uses the singleton pattern to ensure consistent configuration across the application.
 *
 * @remarks
 * Configuration set via this class is merged with service-specific parameters,
 * with service parameters taking precedence over global settings.
 *
 * @example
 * ```typescript
 * // Set global configuration
 * TomTomConfig.instance.put({
 *   apiKey: 'your-api-key',
 *   language: 'en-US'
 * });
 *
 * // Get current configuration
 * const config = TomTomConfig.instance.get();
 *
 * // Reset to defaults
 * TomTomConfig.instance.reset();
 * ```
 *
 * @group Configuration
 */
export class TomTomConfig {
    /**
     * Singleton instance of the configuration.
     */
    static readonly instance = new TomTomConfig();
    private config: GlobalConfig = { ...defaultConfig };

    private constructor() {}

    /**
     * Merge configuration values into the global configuration.
     *
     * New values override existing ones. This performs a shallow merge,
     * so nested objects are replaced entirely rather than merged.
     *
     * @param config - Partial configuration to merge
     *
     * @example
     * ```typescript
     * TomTomConfig.instance.put({
     *   apiKey: 'your-api-key',
     *   language: 'de-DE'
     * });
     * ```
     */
    put(config: Partial<GlobalConfig>) {
        this.config = { ...this.config, ...config };
    }

    /**
     * Reset configuration to default values.
     *
     * Clears all custom configuration and restores the initial defaults.
     * Note that the default API key is an empty string.
     *
     * @example
     * ```typescript
     * TomTomConfig.instance.reset();
     * ```
     */
    reset() {
        this.config = { ...defaultConfig };
    }

    /**
     * Get the current global configuration.
     *
     * @returns Current configuration object
     *
     * @example
     * ```typescript
     * const config = TomTomConfig.instance.get();
     * console.log(config.apiKey);
     * ```
     */
    get() {
        return this.config;
    }
}

/**
 * Merges the global configuration into the given one, with the latter having priority.
 * @ignore
 */
export const mergeFromGlobal = <T extends Partial<GlobalConfig>>(givenConfig: T = {} as T): GlobalConfig & T => ({
    ...TomTomConfig.instance.get(),
    ...givenConfig,
});

/**
 * Whether the SDK is configured for a Demo-BFF-style proxy — no `apiKey` (the
 * proxy injects the real key server-side from a cookie-gated session) plus a
 * non-default `commonBaseURL`.
 *
 * In this mode SDK requests attach `credentials: 'include'` so the proxy's
 * session cookie travels with them. In all other cases — direct TomTom usage
 * and customer-owned `customServiceBaseURL` integrations — credentials stay at
 * the browser default, so we don't break consumers whose backend responds with
 * `Access-Control-Allow-Origin: *` (the browser rejects credentialed responses
 * against a wildcard origin). A customer using `customServiceBaseURL` keeps a
 * real `apiKey`, so this stays false for them.
 *
 * The `apiKey` test is a falsy check (not `=== ''`) on purpose: a proxy build
 * may overwrite the bootstrap's `apiKey: ''` with `apiKey: undefined` (e.g.
 * `put({ apiKey: process.env.API_KEY_EXAMPLES })` when that env var is unset).
 * Both empty string and undefined mean "no key, the proxy injects it" — matching
 * how the URL builders decide whether to append `key=` (`if (apiKey)`).
 *
 * @param config - Config to inspect; defaults to the global {@link TomTomConfig}.
 * @group Configuration
 */
export const isProxyCredentialsMode = (
    config: Partial<Pick<GlobalConfig, 'apiKey' | 'commonBaseURL'>> = TomTomConfig.instance.get(),
): boolean => !config.apiKey && (config.commonBaseURL ?? DEFAULT_COMMON_BASE_URL) !== DEFAULT_COMMON_BASE_URL;
