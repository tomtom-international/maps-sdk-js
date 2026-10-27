import AxeBuilder from '@axe-core/playwright';
import type { Page } from '@playwright/test';

// The WCAG 2.2 levels A and AA, which is what an app embedding a map is usually held to.
const WCAG_A_AND_AA = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

/** How much of the page {@link findAccessibilityViolations} audits, as CSS selectors. */
export type AccessibilityScope = {
    /** What to audit. The whole page when unset. */
    include?: string;
};

type AxeViolation = Awaited<ReturnType<AxeBuilder['analyze']>>['violations'][number];

/** One axe-core rule the page breaks, and where. */
export type AccessibilityViolation = {
    /** The axe-core rule id, such as `color-contrast`. */
    rule: string;
    impact: NonNullable<AxeViolation['impact']> | undefined;
    /** What the rule asks for. */
    help: string;
    /** A CSS selector per element breaking it. */
    elements: string[];
};

/**
 * The WCAG A and AA rules the page breaks.
 *
 * @remarks
 * axe-core audits the DOM only. What the map draws in its canvas is out of its reach.
 */
export const findAccessibilityViolations = async (
    page: Page,
    scope: AccessibilityScope = {},
): Promise<AccessibilityViolation[]> => {
    const builder = new AxeBuilder({ page }).withTags(WCAG_A_AND_AA);
    if (scope.include) builder.include(scope.include);

    const { violations } = await builder.analyze();
    return violations.map(({ id, impact, help, nodes }) => ({
        rule: id,
        impact: impact ?? undefined,
        help,
        elements: nodes.map((node) => node.target.join(' ')),
    }));
};
