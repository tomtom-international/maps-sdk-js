import type { EventHandlerConfig } from './events';

/**
 * Contains configuration options common to all map modules.
 *
 * @group Shared
 */
export type MapModuleCommonConfig = {
    /**
     * Optional configuration for user event handling that applies to this map module only.
     */
    events?: EventHandlerConfig;
};
