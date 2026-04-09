import type { ToolEntry, ToolState } from './types';

/**
 * Merges default tools with user overrides.
 *
 * - `ToolEntry` values add or replace tools in `defaults`.
 * - `false` values remove tools from `defaults`.
 * - Returns a new object — `defaults` is never mutated.
 *
 * @param defaults - Base tool record (typically DEFAULT_TOOLS or empty).
 * @param overrides - User-provided additions, replacements, and exclusions.
 * @returns Resolved tool record ready for setupTools.
 */
export function resolveTools<S extends ToolState>(
    defaults: Record<string, ToolEntry<S>>,
    overrides?: Record<string, ToolEntry<S> | false>,
): Record<string, ToolEntry<S>> {
    const result = { ...defaults };

    if (!overrides) return result;

    for (const [name, entry] of Object.entries(overrides)) {
        if (entry === false) {
            delete result[name];
        } else {
            result[name] = entry;
        }
    }

    return result;
}
