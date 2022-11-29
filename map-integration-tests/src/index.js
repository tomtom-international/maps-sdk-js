// This places the SDK code into the browser, so it can be accessed by the testing software:
// (We use a distinctive module name to make it clear that it's not pulled from regular NPM but locally).
// (See webpack config).
// eslint-disable-next-line @typescript-eslint/no-var-requires
globalThis.GOSDK = require("localGOSDKJSMap");
globalThis.GOSDKCore = require("@anw/go-sdk-js/core");
