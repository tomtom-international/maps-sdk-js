import { ProjectReflection, UrlMapping } from "typedoc";
import { MarkdownTheme, MarkdownThemeRenderContext } from "typedoc-plugin-markdown";
import { customPartials } from "./resources/resources";
import { MarkdownThemeConverterContext } from "typedoc-plugin-markdown/dist/theme-converter-context";

export class MapsSDKThemeConverterContext extends MarkdownThemeConverterContext {
    getUrls(project: ProjectReflection): UrlMapping[] {
        const mapping = super.getUrls(project);
        mapping.forEach((url) => (url.url = url.url.replace(/\.md$/, ".mdx")));
        return mapping;
    }
}

export class MapsSDKThemeRenderContext extends MarkdownThemeRenderContext {
    relativeURL = (url: string | undefined): string | null => super.getRelativeUrl(url)?.replace(/\.mdx?/, "") ?? null;

    partials = customPartials(this);
}

export class MapsSDKTheme extends MarkdownTheme {
    private renderContext?: MapsSDKThemeRenderContext;
    private converterContext?: MapsSDKThemeConverterContext;

    override getConverterContext(): MarkdownThemeConverterContext {
        if (!this.converterContext) {
            this.converterContext = new MapsSDKThemeConverterContext(this, this.application.options);
        }
        return this.converterContext;
    }

    override getRenderContext(): MarkdownThemeRenderContext {
        if (!this.renderContext) {
            this.renderContext = new MapsSDKThemeRenderContext(this, this.application.options);
        }
        return this.renderContext;
    }
}
