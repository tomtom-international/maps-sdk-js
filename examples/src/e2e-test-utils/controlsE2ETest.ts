import type { Page, TestInfo } from '@playwright/test';
import { expect } from '@playwright/test';
import { DEFAULT_MAP_SELECTOR } from './e2eTestConstants';
import { enableMapReadback, waitForMapPainted } from './mapPaint';
import { isReportablePageError, recordPageErrors } from './pageErrors';
import { getExampleURL } from './sanityE2ETest';

const LOAD_TIMEOUT_MS = 30_000;

/** Long enough for a synchronous handler and the frame after it; async work is caught by the final settle. */
const DEFAULT_STEP_SETTLE_MS = 150;

/** For the style loads, searches and recalculations the last steps started, whose errors land late. */
const FINAL_SETTLE_MS = 3000;

/** Keeps a select of every map style, say, from costing a style load per option. */
const DEFAULT_MAX_OPTIONS_PER_SELECT = 3;

/** A panel that adds controls on every change could otherwise grow without end. */
const MAX_CONTROLS = 120;

const CONTROL_SELECTOR = [
    'select',
    'input[type="checkbox"]',
    'input[type="radio"]',
    'input[type="range"]',
    'input[type="color"]',
    'input[type="number"]',
].join(', ');

export type ControlsE2ETestOptions = {
    page: Page;
    testInfo: TestInfo;
    /**
     * Controls left alone, as CSS selectors, for one whose effect leaves the page or that the
     * example's own test drives.
     */
    skip?: readonly string[];
    /** Pause after each change (default: 150ms). */
    stepSettleMs?: number;
    /** Most options tried per select, the starting one excluded (default: 3). */
    maxOptionsPerSelect?: number;
    /** Whether to click the middle of the map once the controls are done (default: true). */
    clickMap?: boolean;
};

/** A control, by the key it is looked up and reported with, and the values to walk it through. */
type ControlStep = { key: string; values: string[] };

/**
 * Drives every form control the example shows through its values, then fails on any error the
 * page reported, naming the step that caused it.
 *
 * The sanity shot sees the example as it loads, so a handler that throws, a knob the SDK rejects or
 * a style edit MapLibre refuses goes unnoticed until a reader moves that control. This walks each
 * one, a select through its options, a checkbox both ways, a range to both ends, and asserts no
 * console error or uncaught exception followed, and that the map still draws afterwards.
 *
 * Controls are looked up again before every step, by what they are rather than where they sit, so
 * a panel the example rebuilds after a change is walked as it now stands, and a section a change
 * reveals is walked too. Text fields and buttons are left alone: what they start (a search, an
 * export, a download) is the example's own to assert.
 */
export const controlsE2ETest = async (options: ControlsE2ETestOptions): Promise<void> => {
    const {
        page,
        testInfo,
        skip = [],
        stepSettleMs = DEFAULT_STEP_SETTLE_MS,
        maxOptionsPerSelect = DEFAULT_MAX_OPTIONS_PER_SELECT,
        clickMap = true,
    } = options;
    testInfo.setTimeout(Math.max(testInfo.timeout, 180_000));

    const pageErrors = recordPageErrors(page);
    // Where in `pageErrors` each step began, so an error is reported with the step that caused it.
    const steps: { label: string; firstError: number }[] = [{ label: 'loading the example', firstError: 0 }];
    const beginStep = (label: string) => steps.push({ label, firstError: pageErrors.length });

    await enableMapReadback(page);
    await page.goto(getExampleURL(testInfo));
    await page.waitForSelector(`${DEFAULT_MAP_SELECTOR} canvas`, { timeout: LOAD_TIMEOUT_MS });
    await waitForMapPainted(page, LOAD_TIMEOUT_MS);
    await installControlLookup(page, skip);

    const walked: string[] = [];
    while (walked.length < MAX_CONTROLS) {
        const control = await page.evaluate(nextControl, { walked, maxOptionsPerSelect });
        if (!control) break;
        walked.push(control.key);
        for (const value of control.values) {
            beginStep(`setting ${control.key} to "${value}"`);
            await page.evaluate(applyControlValue, { key: control.key, value });
            await page.waitForTimeout(stepSettleMs);
        }
    }
    testInfo.annotations.push({ type: 'controls walked', description: String(walked.length) });

    if (clickMap) {
        beginStep('clicking the middle of the map');
        const box = await page.locator(DEFAULT_MAP_SELECTOR).boundingBox();
        if (box) await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    }

    await page.waitForTimeout(FINAL_SETTLE_MS);
    beginStep('waiting for the map to draw again');
    await waitForMapPainted(page, LOAD_TIMEOUT_MS);

    const reported = pageErrors.flatMap((error, errorIndex) => {
        if (!isReportablePageError(error)) return [];
        const step = steps.findLast((candidate) => candidate.firstError <= errorIndex);
        return [`after ${step?.label}: ${error}`];
    });
    expect(reported, 'Moving the controls made the page report errors').toEqual([]);
};

type FormControl = HTMLInputElement | HTMLSelectElement;

/** Each walkable control, keyed by the description a failure names it with. */
type ControlLookup = { __exampleControls: () => Map<string, FormControl> };

/**
 * Puts the control lookup on the page, where every later step reads it, so it is defined once.
 *
 * A control is keyed by its id, or for the panels generated without ids by its kind, name and
 * label, numbered when that repeats. Visible means rendered at all: a native input styled away
 * behind a custom switch or swatch counts, a control in a collapsed or not yet shown section does not.
 */
const installControlLookup = (page: Page, skip: readonly string[]) =>
    page.evaluate(
        ({ selector, skip, mapSelector }) => {
            const isWalkable = (control: FormControl): boolean =>
                !control.disabled &&
                !control.closest(mapSelector) &&
                control.checkVisibility() &&
                !skip.some((skipped) => control.matches(skipped));

            const labelOf = (control: FormControl): string => {
                const label = control.id
                    ? document.querySelector(`label[for="${CSS.escape(control.id)}"]`)
                    : (control.closest('label') ?? control.closest('.ui-form-field')?.querySelector('.ui-form-label'));
                return label?.textContent?.trim().replace(/\s+/g, ' ') ?? '';
            };

            const describe = (control: FormControl): string => {
                const kind = control instanceof HTMLSelectElement ? 'select' : `${control.type} input`;
                const name = control.id ? `#${control.id}` : (control.getAttribute('name') ?? '');
                const label = labelOf(control);
                const radioValue = control.type === 'radio' ? ` = ${control.value}` : '';
                return `${kind} ${name}${label ? ` "${label}"` : ''}${radioValue}`;
            };

            (window as unknown as ControlLookup).__exampleControls = () => {
                const controls = new Map<string, FormControl>();
                for (const control of document.querySelectorAll<FormControl>(selector)) {
                    if (!isWalkable(control)) continue;
                    const description = describe(control);
                    let key = description;
                    for (let repeat = 2; controls.has(key); repeat++) key = `${description} (${repeat})`;
                    controls.set(key, control);
                }
                return controls;
            };
        },
        { selector: CONTROL_SELECTOR, skip: [...skip], mapSelector: DEFAULT_MAP_SELECTOR },
    );

/** The first control not walked yet, with the values to walk it through, or `null` once all are. */
const nextControl = ({
    walked,
    maxOptionsPerSelect,
}: {
    walked: string[];
    maxOptionsPerSelect: number;
}): ControlStep | null => {
    for (const [key, control] of (window as unknown as ControlLookup).__exampleControls()) {
        if (walked.includes(key)) continue;

        if (control instanceof HTMLSelectElement) {
            const values = [...control.options]
                .filter((option) => !option.disabled && option.value !== control.value)
                .slice(0, maxOptionsPerSelect)
                .map((option) => option.value);
            return { key, values };
        }
        switch (control.type) {
            case 'checkbox':
                return { key, values: ['toggle', 'toggle'] };
            case 'radio':
                return { key, values: control.checked ? [] : ['toggle'] };
            case 'color':
                return { key, values: ['#e6194b'] };
            default:
                return {
                    key,
                    values: [control.min, control.max].filter((bound) => bound !== '' && bound !== control.value),
                };
        }
    }
    return null;
};

/** Sets the value the way a reader's input would, so the example's own listeners are what run. */
const applyControlValue = ({ key, value }: { key: string; value: string }): void => {
    const control = (window as unknown as ControlLookup).__exampleControls().get(key);
    // Gone since it was listed: the change before it rebuilt or hid its section.
    if (!control) return;

    if (value === 'toggle') {
        // What a reader's click fires: `click`, then `input` and `change`.
        control.click();
        return;
    }
    control.value = value;
    control.dispatchEvent(new Event('input', { bubbles: true }));
    control.dispatchEvent(new Event('change', { bubbles: true }));
};
