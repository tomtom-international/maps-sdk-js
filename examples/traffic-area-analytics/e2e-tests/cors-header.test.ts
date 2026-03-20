import { expect, test } from '@playwright/test';

/**
 * Verifies that the trafficAreaAnalytics service does NOT send
 * the 'tomtom-user-agent' header, which would cause a CORS preflight failure.
 */
test.describe('CORS header handling', () => {
    test('trafficAreaAnalytics request does not include tomtom-user-agent header', async ({ page }) => {
        const consoleErrors: string[] = [];
        page.on('console', (msg) => {
            if (msg.type() === 'error') consoleErrors.push(msg.text());
        });

        await page.goto('/');
        await page.waitForSelector('#sdk-map', { timeout: 30000 });
        await page.waitForTimeout(2000);

        // Type a city name to trigger geocode → area analytics flow
        await page.locator('#city-input').fill('Madrid');
        await page.waitForSelector('#city-suggestions.visible li', { timeout: 15000 });
        await page.locator('#city-suggestions li').first().click();

        // Wait for the area analytics POST request
        const areaAnalyticsRequest = await page.waitForRequest(
            (req) => req.url().includes('areaanalytics') && req.method() === 'POST',
            { timeout: 30000 },
        );

        // Verify the header is absent (case-insensitive check)
        const headerKeys = Object.keys(areaAnalyticsRequest.headers()).map((k) => k.toLowerCase());
        expect(headerKeys).not.toContain('tomtom-user-agent');

        // No CORS errors in console
        const corsErrors = consoleErrors.filter((e) => e.toLowerCase().includes('cors'));
        expect(corsErrors, 'No CORS errors should appear in console').toHaveLength(0);
    });
});
