import type { ConsoleMessage, Page } from '@playwright/test';
import { describe, expect, it } from 'vitest';
import { isReportablePageError, recordPageErrors } from '../pageErrors';

const THROTTLED = 'Failed to load resource: the server responded with a status of 429 (Too Many Requests)';

// Feeds one console error through `recordPageErrors`, located at the URL the browser gives it.
const recordConsoleError = (text: string, url: string): string[] => {
    let onConsole: (message: ConsoleMessage) => void = () => undefined;
    const page = {
        on: (event: string, handler: (message: ConsoleMessage) => void) => {
            if (event === 'console') onConsole = handler;
        },
    } as unknown as Page;
    const errors = recordPageErrors(page);
    onConsole({
        type: () => 'error',
        text: () => text,
        location: () => ({ url, lineNumber: 0, columnNumber: 0 }),
    } as unknown as ConsoleMessage);
    return errors;
};

describe('recordPageErrors', () => {
    it('appends a failed request its URL, without the query that carries the API key', () => {
        expect(recordConsoleError(THROTTLED, 'https://api.tomtom.com/search/2/x.json?key=secret')).toEqual([
            `${THROTTLED} at https://api.tomtom.com/search/2/x.json`,
        ]);
    });

    it('leaves any other error as the browser wrote it', () => {
        expect(recordConsoleError('Uncaught TypeError', 'https://localhost:9050/index.js')).toEqual([
            'Uncaught TypeError',
        ]);
    });
});

describe('isReportablePageError', () => {
    it.each([
        `${THROTTLED} at https://api.tomtom.com/search/2/x.json`,
        'Failed to load resource: the server responded with a status of 429 () at https://api.tomtom.com/routing/1/x',
        `${THROTTLED} at https://b.api.tomtom.com/map/1/tile/basic/main/1/0/0.pbf`,
    ])('ignores a throttled TomTom API request: %s', (error) => {
        expect(isReportablePageError(error)).toBe(false);
    });

    it.each([
        'Failed to load resource: the server responded with a status of 404 () at https://api.tomtom.com/maps/orbis/assets/fonts/x.pbf',
        `${THROTTLED} at https://demo-proxy.tomtom.com/session/status`,
        `${THROTTLED} at https://api.tomtom.com.example/search`,
        'Failed to load resource: the server responded with a status of 401 (Unauthorized)',
    ])('reports any other failed request: %s', (error) => {
        expect(isReportablePageError(error)).toBe(true);
    });
});
