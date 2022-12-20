import {DeclarationReflection,  Reflection, Renderer} from 'typedoc';
import { MarkdownTheme } from 'typedoc-plugin-markdown';
import { PageEvent } from 'typedoc';
import { registerPartials } from './render-utils';

export class GOSDKTheme extends MarkdownTheme {
    constructor(renderer: Renderer) {
        super(renderer);
        registerPartials();
    }

    render(page: PageEvent<Reflection>): string {
        // Workaround for escaping characters, since the plugin doesn't allow customizing escaped characters (yet)
        return super.render(page)
            .replace(/<(?!(\/?)(Accordion|a))/g, "\\<") // matches all < except in Accordion and a tags
            .replace(/(?<!{){(?!(<a|{))/g, "\\{"); //matches all { except in {{ and {<a
    }

    getRelativeUrl(url: string) {
        return super.getRelativeUrl(url).replace(/(.*).mdx/, '$1');
    }

    toUrl(mapping: any, reflection: DeclarationReflection) {
        return mapping.directory + '/' + this.getUrl(reflection) + '.mdx';
    }
}
