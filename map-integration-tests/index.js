// This places the SDK code into the browser, so it can be accessed by the testing software:
// (We use a distinctive module name to make it clear that it's not pulled from regular NPM but locally).
// (See webpack config).

globalThis.MapsSDKCore = require('@cet/maps-sdk-js/core');
globalThis.MapsSDK = require('localMapsSDKJSMap');
