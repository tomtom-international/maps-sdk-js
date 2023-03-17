import { Application } from "typedoc";

import { MapsSDKTheme } from "./theme";

export function load(app: Application) {
    app.renderer.defineTheme("maps-sdk-theme", MapsSDKTheme);
}
