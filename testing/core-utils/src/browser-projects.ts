import { devices, type Project } from '@playwright/test';

/** The tag on the only tests the non-Chromium projects run: those proving a map loads at all. */
export const TAG_CROSS_BROWSER = '@cross-browser';

const CROSS_BROWSER_ONLY = new RegExp(TAG_CROSS_BROWSER);

/**
 * Headless Chromium-based browsers have no GPU, so WebGL needs SwiftShader, which the Chrome for Testing
 * builds Playwright ships since v1.57 no longer enable by default; the GPU sandbox can block it from starting.
 * See https://github.com/microsoft/playwright/pull/39129
 */
const SWIFTSHADER_ARGS = ['--enable-unsafe-swiftshader', '--disable-gpu-sandbox'];

/**
 * MapLibre needs WebGL2, which Firefox on a GPU-less Linux box only offers headed (so CI runs it
 * under `xvfb-run`), and only once forced past its blocklisting of the software GL it gets there.
 */
const FIREFOX_WEBGL_USE = {
    headless: !process.env.CI,
    launchOptions: { firefoxUserPrefs: { 'webgl.force-enabled': true } },
};

/**
 * The Playwright projects of every e2e suite: Chromium runs every test, Firefox and WebKit only the
 * `@cross-browser` ones. Edge joins them when `INCLUDE_MSEDGE` is set, as it is a system-wide install
 * (`playwright install msedge`) with no Linux arm64 build.
 */
export const browserProjects = (): Project[] => [
    { name: 'chromium', use: { ...devices['Desktop Chrome'], launchOptions: { args: SWIFTSHADER_ARGS } } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'], ...FIREFOX_WEBGL_USE }, grep: CROSS_BROWSER_ONLY },
    { name: 'webkit', use: { ...devices['Desktop Safari'] }, grep: CROSS_BROWSER_ONLY },
    ...(process.env.INCLUDE_MSEDGE
        ? [
              {
                  name: 'msedge',
                  use: { ...devices['Desktop Edge'], launchOptions: { args: SWIFTSHADER_ARGS } },
                  grep: CROSS_BROWSER_ONLY,
              },
          ]
        : []),
];
