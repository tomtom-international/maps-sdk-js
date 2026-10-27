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

/** Settle time for a `Buildings3D` example's shot: it extrudes the tiles over several frames after they arrive, seconds under SwiftShader. */
export const BUILDINGS_EXTRUDE_MS = 4000;

/** Load budget of the heavy 3D examples, the cinematic ones and the 3D cities: buildings with shadows, landmarks, surfaces and effects draw a frame or two a second under SwiftShader. */
export const CINEMATIC_MAP_LOAD_TIMEOUT = 120_000;

/**
 * Test tag constants for filtering tests
 */
export const TAG_PROD = '@prod';
export const TAG_AGENT_EVAL = '@agenteval';
