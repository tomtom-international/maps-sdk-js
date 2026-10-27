import { test } from '@playwright/test';
import { TAG_PROD } from '../../src/e2e-test-utils/e2eTestConstants';
import { sanityE2ETest } from '../../src/e2e-test-utils/sanityE2ETest';

test.describe('sanity', () => {
    test('sanity test - prod', { tag: TAG_PROD }, async ({ page }) => {
        // Arrival and departure times follow the clock, and the durations follow live traffic, as
        // do the alternatives' roads and where the bar's lanes place their sections and stays. The
        // chrome shot is compared at near-zero tolerance, so those texts are pinned and the lanes emptied.
        await sanityE2ETest({
            page,
            testInfo: test.info(),
            mapLoadTimeout: 45_000,
            readySelector: '.ui-sections-bar',
            uiPinnedValues: {
                '.ui-alternative-time': '0 h 00 min',
                '.ui-alternative-detail': '00 km',
                '.ui-alternative-roads': 'via A00',
                '.ui-itinerary .ui-stop-subtitle': 'Arrive 00:00',
                '.ui-itinerary-leg': '00 km',
                '.ui-detail-list dd': '00:00',
                '.ui-sections-readout': '00 km',
                '.ui-lane-axis span': '00',
                '.ui-lane-track': '',
            },
        });
    });
});
