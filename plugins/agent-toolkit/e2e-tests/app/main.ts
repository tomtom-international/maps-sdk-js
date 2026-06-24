// Minimal harness page: wires the iframe-worker sandbox executor (from SDK source)
// to a global the Playwright spec drives. We exercise the executor directly rather
// than a full `createMapAgent` so the test needs no map / API key / model.
import { resolveSandboxExecutor } from '../../src/tools/shared/sandbox';

declare global {
    // `var` (not `interface Window`) so the binding is typed on `globalThis` too —
    // the spec drives it via `globalThis.runInSandbox`. (Ambient augmentation requires `var`.)
    var runInSandbox: (code: string, paramNames?: string[], args?: unknown[]) => Promise<unknown>;
}

// In a real browser this resolves to the iframe-worker executor (mandatory in-browser).
const executor = resolveSandboxExecutor({ timeoutMs: 2_000 });

globalThis.runInSandbox = (code, paramNames = [], args = []) => executor.run(code, paramNames, args, 'E2E');

// Signal readiness so the spec can wait deterministically.
const status = document.getElementById('status');
if (status) status.textContent = 'ready';
