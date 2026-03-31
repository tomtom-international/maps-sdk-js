import { type Tool } from 'ai';
import { createMapToolSet } from './tools';
import type { MapAgentOptions, ToolState } from './types';

/**
 * Builds the agent's tool set: default SDK tools + user overrides.
 */
export function setupTools(state: ToolState, options: MapAgentOptions): Record<string, Tool> {
    const defaultToolSet = createMapToolSet(state);
    const toolSet: Record<string, Tool> = {};

    // Start with default tools unless explicitly disabled
    if (options.includeDefaultTools ?? true) {
        for (const [name, tool] of Object.entries(defaultToolSet)) {
            toolSet[name] = tool;
        }
    }

    // Apply tools configuration (exclude, override, add)
    for (const [name, override] of Object.entries(options.tools ?? {})) {
        if (override === false) {
            // Exclude: remove from final set
            delete toolSet[name];
        } else if (override !== undefined) {
            // Override or add: replace or add to final set
            toolSet[name] = override;
        }
    }

    return toolSet;
}
