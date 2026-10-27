import { devices, type Project } from '@playwright/test';

/** The tag on the tests every project runs, each engine and the scaled Chromium alike. They take no screenshot. */
export const TAG_CROSS_BROWSER = '@cross-browser';

/**
 * The tag on the screenshot tests Firefox and WebKit run too, each against baselines of its own.
 *
 * @remarks
 * Those baselines are captures of the Linux CI container, where both engines draw WebGL in software. Anywhere
 * else they draw on the GPU, so outside that container Chromium alone runs these tests.
 */
export const TAG_CROSS_BROWSER_VISUAL = '@cross-browser-visual';

/** Matches the tag alone, not as the start of a longer one. */
const taggedWith = (tag: string) => new RegExp(String.raw`${tag}(?![\w-])`);

const CROSS_BROWSER = taggedWith(TAG_CROSS_BROWSER);
const CROSS_BROWSER_VISUAL = taggedWith(TAG_CROSS_BROWSER_VISUAL);

/** The Linux CI container, or `pnpm e2e-test:in-container`, which runs the same image. */
export const IN_LINUX_CI = process.platform === 'linux' && Boolean(process.env.CI);

/** CI's Windows lane, a GitHub-hosted `windows-latest` runner. */
export const IN_WINDOWS_CI = process.platform === 'win32' && Boolean(process.env.CI);

/**
 * Headless Chromium-based browsers have no GPU, so WebGL needs SwiftShader, which the Chrome for Testing
 * builds Playwright ships leave off; the GPU sandbox can block it from starting.
 * See https://github.com/microsoft/playwright/pull/39129
 *
 * On Windows, ANGLE reaches for Direct3D first, whose context the headless shell can lose: naming SwiftShader
 * there keeps WebGL on the rasteriser the baselines were drawn with. Elsewhere it stays off, as it also changes
 * how the compositor draws a `backdrop-filter`, which the map-effects baselines hold.
 */
const SWIFTSHADER_ARGS = [
    '--enable-unsafe-swiftshader',
    '--disable-gpu-sandbox',
    ...(process.platform === 'win32' ? ['--use-angle=swiftshader'] : []),
];

/**
 * MapLibre needs WebGL2, which Firefox on a GPU-less Linux box only offers headed (so CI runs it
 * under `xvfb-run`), and only once forced past its blocklisting of the software GL it gets there.
 */
const FIREFOX_WEBGL_USE = {
    headless: !process.env.CI,
    launchOptions: { firefoxUserPrefs: { 'webgl.force-enabled': true } },
};

/**
 * Firefox and WebKit draw WebGL in software in CI, a frame taking seconds, so two of either at once next to
 * Chromium's workers overrun the timeouts the Chromium-paced suites set.
 */
const SOFTWARE_WEBGL_PACE = { workers: 1, timeout: 120_000, expect: { timeout: 15_000 } };

/** Windows' 125% display scale, the default on many laptops, where a canvas sized in CSS pixels meets a fractional ratio. */
const SCALED_DEVICE_PIXEL_RATIO = 1.25;

/**
 * The Playwright projects of every e2e suite.
 *
 * @remarks
 * - `chromium` runs every test.
 * - `chromium-scaled`, Firefox and WebKit run the `@cross-browser` ones. Edge joins them when `INCLUDE_MSEDGE`
 *   is set, as it is a system-wide install (`playwright install msedge`) with no Linux arm64 build.
 * - Firefox and WebKit also run the `@cross-browser-visual` ones, in the Linux CI container only.
 *
 * @param snapshotsDirectory Where the suite's baselines live, as a `snapshotPathTemplate` prefix. Chromium's
 * sit in it, Firefox's and WebKit's in a folder named after the engine beneath it. A suite taking no
 * screenshot leaves it out.
 */
export const browserProjects = (snapshotsDirectory?: string): Project[] => {
    const snapshotsOf = (engine?: 'firefox' | 'webkit') =>
        snapshotsDirectory
            ? { snapshotPathTemplate: [snapshotsDirectory, engine, '{arg}{ext}'].filter(Boolean).join('/') }
            : {};
    const engineTests = IN_LINUX_CI ? [CROSS_BROWSER, CROSS_BROWSER_VISUAL] : [CROSS_BROWSER];

    return [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'], launchOptions: { args: SWIFTSHADER_ARGS } },
            ...snapshotsOf(),
        },
        {
            name: 'chromium-scaled',
            use: {
                ...devices['Desktop Chrome'],
                deviceScaleFactor: SCALED_DEVICE_PIXEL_RATIO,
                launchOptions: { args: SWIFTSHADER_ARGS },
            },
            grep: CROSS_BROWSER,
        },
        {
            name: 'firefox',
            use: { ...devices['Desktop Firefox'], ...FIREFOX_WEBGL_USE },
            grep: engineTests,
            ...SOFTWARE_WEBGL_PACE,
            ...snapshotsOf('firefox'),
        },
        {
            name: 'webkit',
            use: { ...devices['Desktop Safari'] },
            grep: engineTests,
            ...SOFTWARE_WEBGL_PACE,
            ...snapshotsOf('webkit'),
        },
        ...(process.env.INCLUDE_MSEDGE
            ? [
                  {
                      name: 'msedge',
                      use: { ...devices['Desktop Edge'], launchOptions: { args: SWIFTSHADER_ARGS } },
                      grep: CROSS_BROWSER,
                  },
              ]
            : []),
    ];
};
