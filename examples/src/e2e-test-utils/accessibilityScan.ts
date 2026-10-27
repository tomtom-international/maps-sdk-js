import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';
import { type AccessibilityViolation, findAccessibilityViolations } from '@testing/core-utils';
import { KNOWN_ACCESSIBILITY_VIOLATIONS } from './knownAccessibilityViolations.data';

/**
 * How long the scan may take on top of the page's load: on a page still rendering 3D terrain under
 * SwiftShader, axe-core's pass alone takes over ten seconds.
 */
export const ACCESSIBILITY_SCAN_TIMEOUT = 30_000;

const isSerious = ({ impact }: AccessibilityViolation): boolean => impact === 'serious' || impact === 'critical';

const describeViolation = ({ rule, impact, help, elements }: AccessibilityViolation): string =>
    `${rule} (${impact}): ${help} — ${elements.join(', ')}`;

const alphabetically = (left: string, right: string): number => left.localeCompare(right);

/**
 * Fails the test when the example breaks a serious or critical WCAG A or AA rule other than those
 * {@link KNOWN_ACCESSIBILITY_VIOLATIONS} lists for it, or no longer breaks one listed.
 *
 * The moderate and minor ones stay out: `meta-viewport` among them, which every example breaks
 * through the template's `user-scalable=no`.
 */
export const expectKnownAccessibilityViolations = async (page: Page, exampleName: string): Promise<void> => {
    const violations = (await findAccessibilityViolations(page)).filter(isSerious);
    expect(
        violations.map(({ rule }) => rule).sort(alphabetically),
        `The accessibility rules broken changed:\n${violations.map(describeViolation).join('\n')}`,
    ).toEqual([...(KNOWN_ACCESSIBILITY_VIOLATIONS[exampleName] ?? [])].sort(alphabetically));
};
