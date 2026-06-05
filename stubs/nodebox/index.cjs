// See index.mjs for rationale.
const INJECT_MESSAGE_TYPE = 'sandpack-stub:inject';
const PREVIEW_LOADED_MESSAGE_TYPE = 'sandpack-stub:preview-loaded';
class Nodebox {
    isStub = true;
    constructor() {
        throw new Error(
            "@codesandbox/nodebox is stubbed in this monorepo (pnpm.overrides → stubs/nodebox). " +
            "The SDK examples don't use Sandpack's node-mode templates, so this should never be instantiated. " +
            "If you see this error, check whether a new example introduced a node-mode Sandpack template.",
        );
    }
}
module.exports = { INJECT_MESSAGE_TYPE, PREVIEW_LOADED_MESSAGE_TYPE, Nodebox };
