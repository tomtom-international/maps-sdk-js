import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import type { GlobalConfig } from '../globalConfig';
import { defaultConfig, isProxyCredentialsMode, mergeFromGlobal, TomTomConfig } from '../globalConfig';

describe('GlobalConfig', () => {
    afterEach(() => TomTomConfig.instance.reset());

    test('TomTomConfig is a singleton', () => {
        // @ts-ignore
        const newInstance = new TomTomConfig();
        const staticInstance = TomTomConfig.instance;

        expect(newInstance).toEqual(staticInstance);
    });

    test('TomTomConfig contains default config', () => {
        expect(TomTomConfig.instance.get()).toEqual(
            expect.objectContaining({
                commonBaseURL: expect.any(String),
                apiKey: '',
            }),
        );
    });

    test('TomTomConfig config can be modified', () => {
        const apiKey = 'TEST_KEY';

        TomTomConfig.instance.put({ apiKey });

        expect(TomTomConfig.instance.get()).toEqual(
            expect.objectContaining({
                commonBaseURL: expect.any(String),
                apiKey,
            }),
        );
    });

    test('TomTomConfig config can be completely overwritten', () => {
        const cfg: GlobalConfig = {
            apiKey: 'TEST_KEY',
            apiVersion: 2,
            language: 'nl-NL',
            commonBaseURL: 'https://example.com',
        };

        TomTomConfig.instance.put(cfg);

        expect(TomTomConfig.instance.get()).toEqual({ ...cfg, retry: defaultConfig.retry });
    });
});

describe('mergeFromGlobal tests', () => {
    beforeEach(() => TomTomConfig.instance.reset());

    test('mergeFromGlobal with default global config', () => {
        expect(mergeFromGlobal()).toEqual({
            commonBaseURL: 'https://api.tomtom.com',
            apiKey: '',
            apiVersion: 1,
            retry: defaultConfig.retry,
        });
        expect(mergeFromGlobal({ randomProp: 'blah', apiKey: 'CUSTOM_API_KEY' })).toEqual({
            apiKey: 'CUSTOM_API_KEY',
            apiVersion: 1,
            commonBaseURL: 'https://api.tomtom.com',
            retry: defaultConfig.retry,
            randomProp: 'blah',
        });
    });

    test('mergeFromGlobal with given global config', () => {
        TomTomConfig.instance.put({
            apiKey: 'GLOBAL_API_KEY',
            apiVersion: 2,
            language: 'it-IT',
        });
        expect(mergeFromGlobal()).toEqual({
            apiKey: 'GLOBAL_API_KEY',
            apiVersion: 2,
            commonBaseURL: 'https://api.tomtom.com',
            retry: defaultConfig.retry,
            language: 'it-IT',
        });
        expect(mergeFromGlobal({})).toEqual({
            apiKey: 'GLOBAL_API_KEY',
            apiVersion: 2,
            commonBaseURL: 'https://api.tomtom.com',
            retry: defaultConfig.retry,
            language: 'it-IT',
        });
        expect(mergeFromGlobal<Partial<GlobalConfig> & { randomProp: string }>({ randomProp: 'blah' })).toEqual({
            randomProp: 'blah',
            apiKey: 'GLOBAL_API_KEY',
            apiVersion: 2,
            commonBaseURL: 'https://api.tomtom.com',
            retry: defaultConfig.retry,
            language: 'it-IT',
        });
        expect(
            mergeFromGlobal<Partial<GlobalConfig> & { randomProp: string }>({
                randomProp: 'blah',
                apiVersion: 3,
                // TODO: restore if we implement oauth2 access:
                // apiAccessToken: 'OAUTH2_ACCESS_TOKEN',
                commonBaseURL: 'CUSTOM',
                language: 'es-ES',
            }),
        ).toEqual({
            randomProp: 'blah',
            apiKey: 'GLOBAL_API_KEY',
            apiVersion: 3,
            // TODO: restore if we implement oauth2 access:
            // apiAccessToken: 'OAUTH2_ACCESS_TOKEN',
            commonBaseURL: 'CUSTOM',
            retry: defaultConfig.retry,
            language: 'es-ES',
        });
    });
});

describe('isProxyCredentialsMode', () => {
    afterEach(() => TomTomConfig.instance.reset());

    test('reads the global config: proxy base URL + no apiKey is true', () => {
        TomTomConfig.instance.put({ apiKey: '', commonBaseURL: 'https://proxy.example.com' });
        expect(isProxyCredentialsMode()).toBe(true);
    });

    test('reads the global config: default host is false', () => {
        expect(isProxyCredentialsMode()).toBe(false);
    });

    test('an explicit apiKey is false, even behind a proxy base URL', () => {
        expect(isProxyCredentialsMode({ apiKey: 'KEY', commonBaseURL: 'https://proxy.example.com' })).toBe(false);
    });

    test('undefined apiKey with a proxy base URL is true (falsy check, not === "")', () => {
        expect(isProxyCredentialsMode({ apiKey: undefined, commonBaseURL: 'https://proxy.example.com' })).toBe(true);
    });

    test('undefined commonBaseURL defaults to the TomTom host, so it is false', () => {
        expect(isProxyCredentialsMode({ apiKey: '' })).toBe(false);
    });
});
