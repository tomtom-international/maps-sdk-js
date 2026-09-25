/**
 * Default timeout for waiting for the map to render (ms)
 */
export const DEFAULT_MAP_LOAD_TIMEOUT = 60000;

/**
 * Default selector for the map container element
 */
export const DEFAULT_MAP_SELECTOR = '#sdk-map';

/** Tolerance for the whole-page shots, which are dominated by the genuinely variable WebGL map. */
export const WHOLE_PAGE_MAX_DIFF_RATIO = 0.15;

/**
 * Test tag constants for filtering tests
 */
export const TAG_PROD = '@prod';
export const TAG_SANDPACK = '@sandpack';
export const TAG_AGENT_EVAL = '@agenteval';
