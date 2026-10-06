import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';

/**
 * What the page reports as an error that no example can act on, matched against the message text.
 *
 * Every entry buys silence back at the price of the check, so each one names a single known source
 * rather than a class of failure.
 */
const IGNORED_MESSAGES: readonly RegExp[] = [
    // The suite drives every example at the live APIs from parallel workers, so some requests are
    // throttled on any given run. What an HTTP failure does to the page is caught where it belongs: a map that
    // never paints fails `waitForMapPainted`, and one that paints wrong fails its snapshot.
    /^Failed to load resource:/,
];

/**
 * Starts recording everything the page reports as an error, and returns the list it fills.
 *
 * Call it before `goto`: the failures worth catching happen while the page loads.
 */
export const recordPageErrors = (page: Page): string[] => {
    const errors: string[] = [];
    page.on('console', (message) => {
        if (message.type() === 'error') errors.push(message.text());
    });
    page.on('pageerror', (error) => errors.push(`${error.name}: ${error.message}`));
    return errors;
};

/** Whether an error the page reported is the example's own, rather than a known third-party source. */
export const isReportablePageError = (error: string): boolean =>
    !IGNORED_MESSAGES.some((pattern) => pattern.test(error));

/**
 * Fails the test if the page reported an error of its own.
 *
 * The whole-page shot cannot stand in for it: an example that loses one overlay still draws its
 * map, its chrome and its labels, so what went missing moves fewer pixels than the tolerance a
 * live WebGL map has to carry. The console names the cause instead, at no tolerance at all.
 */
export const expectNoPageErrors = (errors: readonly string[]): void => {
    expect(
        errors.filter(isReportablePageError),
        'The page reported errors, so something it was asked to draw or build failed',
    ).toEqual([]);
};
