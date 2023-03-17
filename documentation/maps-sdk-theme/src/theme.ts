import { DeclarationReflection, PageEvent, Reflection, Renderer } from "typedoc";
import { MarkdownTheme } from "typedoc-plugin-markdown";
import { basename, join } from "path";
import { readdirSync, readFileSync } from "fs";
import * as Handlebars from "handlebars";

export class MapsSDKTheme extends MarkdownTheme {
    constructor(renderer: Renderer) {
        super(renderer);
        this.registerPartials();
    }

    /**
     * Workaround for escaping characters in the output, since the plugin
     * doesn't allow customizing which characters are escaped (yet)
     */
    render(page: PageEvent<Reflection>): string {
        return super
            .render(page)
            .replace(/<(?!(\/?)(Accordion|a))/g, "\\<") // matches all < except in Accordion and a tags
            .replace(/(?<!{){(?!(<a|{))/g, "\\{"); //matches all { except in {{ and {<a
    }

    /**
     * Removing `.mdx` extension from relative links (developer portal requirement).
     */
    getRelativeUrl(url: string) {
        return super.getRelativeUrl(url).replace(/\.mdx/, "");
    }

    /**
     * Output `.mdx` urls instead of '.md' (developer portal requirement).
     */
    toUrl(mapping: any, reflection: DeclarationReflection) {
        return mapping.directory + "/" + this.getUrl(reflection) + ".mdx";
    }

    /**
     * Overwrites the partials defined by typedoc-plugin-markdowns with the partials we have defined in `./resources/partials`
     */
    registerPartials() {
        const partialsFolder = join(__dirname, "resources", "partials");
        const partialFiles = readdirSync(partialsFolder);
        partialFiles.forEach((partialFile) => {
            const partialName = basename(partialFile, ".hbs");
            const partialContent = readFileSync(partialsFolder + "/" + partialFile).toString();
            Handlebars.registerPartial(partialName, partialContent);
        });
    }
}
