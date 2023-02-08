import { MarkdownTheme } from "typedoc-plugin-markdown";
import { Renderer, RendererEvent } from "typedoc";
import * as path from "path";
import { URL_PREFIX } from "typedoc-plugin-markdown/dist/support/constants";

export class MyCustomTheme extends MarkdownTheme {
    constructor(renderer: Renderer) {
        super(renderer);

        this.listenTo(this.owner, {
            [RendererEvent.BEGIN]: this.onBeginRenderer
        });
    }

    protected onBeginRenderer(e: RendererEvent) {
        this.getRenderContext().partials = {
            ...this.getRenderContext().partials,
            member: (() => {
                const base_member = this.getRenderContext().partials.member;
                return (reflection) =>
                    `<Accordion label="${reflection.name}">\n\n${base_member(reflection)}\n\n</Accordion>`;
            })()
        };

        this.getRenderContext().relativeURL = (url) => {
            if (!url) {
                return null;
            }
            if (URL_PREFIX.test(url)) {
                return url;
            } else {
                const relative = path.relative(path.dirname(this.getRenderContext().activeLocation), path.dirname(url));
                return path
                    .join("../", relative, path.basename(url))
                    .replace(/\\/g, "/")
                    .replace(/(.*).md/, "$1");
            }
        };
    }
}
