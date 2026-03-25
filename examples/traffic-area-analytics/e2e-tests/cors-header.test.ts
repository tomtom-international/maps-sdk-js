import { expect, test } from '@playwright/test';

/**
 * Verifies that the trafficAreaAnalytics service sends the 'tomtom-user-agent'
 * header and no CORS errors occur (the server now allows this header).
 */
test.describe('CORS header handling', () => {
    test('trafficAreaAnalytics request includes tomtom-user-agent header without CORS errors', async ({ page }) => {
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

        // Verify the header is present (case-insensitive check)
        const headerKeys = Object.keys(areaAnalyticsRequest.headers()).map((k) => k.toLowerCase());
        expect(headerKeys).toContain('tomtom-user-agent');

        // No CORS errors in console
        const corsErrors = consoleErrors.filter((e) => e.toLowerCase().includes('cors'));
        expect(corsErrors, 'No CORS errors should appear in console').toHaveLength(0);
    });
});
