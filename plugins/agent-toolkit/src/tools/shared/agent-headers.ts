/**
 * @module agent-toolkit-tools
 */

import { TOMTOM_USER_AGENT_SDK_NAME } from '@tomtom-org/maps-sdk/core';
import { version } from '../../../package.json';

export const AGENT_TOOLKIT_ID = 'AgentToolkit';

/**
 * The `tomtom-user-agent` value identifying agent-toolkit traffic. Shared by both paths that carry
 * it — {@link withAgentToolkitHeaders} on service calls, `createMapAgent` on the map — so the two
 * cannot drift into separate analytics rows.
 *
 * @ignore
 */
export const AGENT_TOOLKIT_USER_AGENT = `${TOMTOM_USER_AGENT_SDK_NAME}-${AGENT_TOOLKIT_ID}/${version}`;

/**
 * Tags an SDK service call as coming from agent-toolkit, via the SDK's own supported per-call
 * `tomtom-user-agent` override (see `generateTomTomHeaders`, `core/src/util/headers.ts`) — reuses
 * an existing, already-allow-listed header rather than adding a new one.
 *
 * Not applicable to `searchOne`/`geocodeOne` (and the `searchOneFn`/`geocodeOneFn` dispatch in
 * `locate-places.ts`) — those take a bare query string with no params object to tag.
 *
 * @ignore
 */
export const withAgentToolkitHeaders = <P extends object>(params: P): P => ({
    ...params,
    'tomtom-user-agent': AGENT_TOOLKIT_USER_AGENT,
});
