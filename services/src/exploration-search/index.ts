/**
 * @module exploration-search
 *
 * @remarks
 * No longer exported from the `services` barrel. It targeted a pre-GA proof-of-concept host
 * outside TomTom's domain and sent no API key. The module is retained, unexported, because its
 * `from` / `size` / `total` paging contract is the evidence behind the Places Search v3 pagination
 * request. Nothing in the public API reaches it.
 *
 * @ignore
 * @experimental
 */

export * from './explorationSearch';
export type * from './types';
export { POPULATED_AREA_TAGS, RESERVED_AREA_TAGS } from './types';
