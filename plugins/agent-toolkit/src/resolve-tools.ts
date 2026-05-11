import type { ToolDefinition, ToolEntry, ToolNameHint, ToolState } from './types';

/**
 * Merges default tools with user overrides.
 *
 * - `ToolEntry` (or builder) values add or replace tools in `defaults`.
 * - `false` values remove tools from `defaults`.
 * - Returns a new object — `defaults` is never mutated.
 *
 * Default entries may be {@link ToolEntryBuilder builders} that produce
 * their {@link ToolEntry} from build-time options. Builders pass through
 * untouched and are materialized later by `setupTools`.
 *
 * @param defaults - Base tool record (typically DEFAULT_TOOLS or empty).
 * @param overrides - User-provided additions, replacements, and exclusions.
 * @returns Resolved tool record ready for setupTools.
 *
 * @group Agent Toolkit
 */
export const resolveTools = <S extends ToolState>(
    defaults: Record<string, ToolDefinition<S>>,
    overrides?: { [K in ToolNameHint]?: ToolEntry<S> | false | undefined },
): Record<string, ToolDefinition<S>> => {
    const result: Record<string, ToolDefinition<S>> = { ...defaults };

    if (!overrides) return result;

    for (const [name, entry] of Object.entries(overrides)) {
        if (entry) {
            result[name] = entry;
        } else {
            delete result[name];
        }
    }

    return result;
};
