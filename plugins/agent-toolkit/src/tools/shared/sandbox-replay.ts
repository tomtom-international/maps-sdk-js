/**
 * @module agent-toolkit-tools
 *
 * The shared sandbox-replay step: run sandbox `code` over already-prepared inputs in the env-resolved
 * executor with the recurring extras (`previous` / `now` / `log`), and validate the result. This is the
 * one sandbox run sequence behind BOTH recurring engines — the `analyseData` standing sweep
 * (`analyses-runtime.ts`) and the incidents clustering re-run (`clusters-runtime.ts`) — so the
 * pack → run → validate path lives in exactly one place. Callers own input prep and any
 * source-unchanged skip (they differ per engine); this owns only the realm-crossing run.
 */

import * as turf from '@turf/turf';
import * as h3 from 'h3-js';
import type { ToolState } from '../../types';
import { MULTI_INPUT_SANDBOX_PARAMS, type PreparedInputs, packSandboxArgs } from './multi-input';
import { type AnalysisOutputFormat, runSandboxedFn, validateAnalysisResult } from './sandbox-code';

/** Injected sandbox params for a recurring run: the merged inputs plus `previous` / `now` / `log`. */
export const STANDING_SANDBOX_PARAMS = [...MULTI_INPUT_SANDBOX_PARAMS, 'previous', 'now', 'log'] as const;

/**
 * Run already-prepared sandbox `code` with the standing extras, then validate. Threads `previous` (the
 * prior result) and `now` (`new Date(sampledAt)`) into the body and runs in the env-resolved executor
 * (`state.codeExecution` — iframe-worker in the browser, main thread in Node/SSR; `createMapAgent` may
 * have overridden it, and it's in scope here because this is the tool layer). Returns `{ value }` or
 * `{ error }` and never throws.
 *
 * @ignore
 */
export const runPreparedSandbox = async (
    state: ToolState,
    prepared: PreparedInputs,
    args: { code: string; previous: unknown; sampledAt: number; outputFormat: AnalysisOutputFormat },
): Promise<{ value: unknown } | { error: string }> => {
    const result = await runSandboxedFn(
        args.code,
        STANDING_SANDBOX_PARAMS,
        [...packSandboxArgs(prepared.sandbox, { h3, turf }), args.previous, new Date(args.sampledAt), () => {}],
        'Analysis',
        state.codeExecution,
    );
    if ('error' in result) return result;
    return validateAnalysisResult(result.value, args.outputFormat);
};
