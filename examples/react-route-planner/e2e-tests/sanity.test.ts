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
                // The stop list prints the address search returned. The same query can come back on a
                // different street, so each row is pinned to the address this chrome shot was taken with.
                '.ui-stop-list .ui-stop:nth-child(1) .ui-stop-subtitle': 'Corso Vittorio Emanuele II 53, 10125 Turin',
                '.ui-stop-list .ui-stop:nth-child(2) .ui-stop-subtitle':
                    'Via Vittorio Emanuele II 85, 11020 Bard · stay 1 hr',
                '.ui-stop-list .ui-stop:nth-child(3) .ui-stop-subtitle': 'stay 1 hr 30 min',
                '.ui-stop-list .ui-stop:nth-child(4) .ui-stop-subtitle': '',
                '.ui-itinerary-leg': '00 km',
                '.ui-detail-list dd': '00:00',
                '.ui-sections-readout': '00 km',
                '.ui-lane-axis span': '00',
                '.ui-lane-track': '',
            },
            // How many lanes the route has follows the sections search returned, and the bar is
            // anchored to the bottom, so one lane more or less moves the whole strip. The chart
            // keeps a fixed box and its rows stay out of the shot.
            uiPinnedStyle:
                '.ui-sections-chart { height: 148px; overflow: hidden; } .ui-lane-tracks, .ui-lane-labels { visibility: hidden; }',
        });
    });
});
