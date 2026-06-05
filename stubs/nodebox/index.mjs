// Named exports required by @codesandbox/sandpack-client's clients/node module
// for static analysis. The dynamic import of clients/node is never triggered
// because the SDK examples only use Sandpack's static templates (vanilla-ts,
// react-ts), so these values are never read at runtime.
export const INJECT_MESSAGE_TYPE = 'sandpack-stub:inject';
export const PREVIEW_LOADED_MESSAGE_TYPE = 'sandpack-stub:preview-loaded';
export class Nodebox {
    isStub = true;
    constructor() {
        throw new Error(
            "@codesandbox/nodebox is stubbed in this monorepo (pnpm.overrides → stubs/nodebox). " +
            "The SDK examples don't use Sandpack's node-mode templates, so this should never be instantiated. " +
            "If you see this error, check whether a new example introduced a node-mode Sandpack template.",
        );
    }
}
