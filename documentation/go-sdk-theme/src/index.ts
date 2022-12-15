import { Application } from 'typedoc';

import { GOSDKTheme } from './theme';

export function load(app: Application) {
    app.renderer.defineTheme('go-sdk-theme', GOSDKTheme);
}
