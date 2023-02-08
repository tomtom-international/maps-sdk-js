import { MarkdownThemeRenderContext, partials } from "typedoc-plugin-markdown";
import { ContainerReflection, DeclarationReflection } from "typedoc";
import { member } from "typedoc-plugin-markdown/dist/partials/member";
import { members } from "typedoc-plugin-markdown/dist/partials/members";
import { getReflectionTitle } from "typedoc-plugin-markdown/dist/support/helpers";

// Wrap all members in devportal Accordion components. Also adds an invisible anchor tag above each Accordion, which
// allows linking to the Accordion. Invisible anchor tag is needed until devportal supports linking to Accordions.
const customMember = (context: MarkdownThemeRenderContext, reflection: DeclarationReflection) => {
    const baseMember = member(context, reflection);
    const endOfFirstLine = baseMember.indexOf("\n");
    const memberWithoutTitle = baseMember.substring(endOfFirstLine + 1);

    return `{<a style={{display: 'block', margin: '0', padding: '0'}} name="${
        reflection.name
    }"></a>}\n\n<Accordion label="${getReflectionTitle(reflection)}">\n\n${memberWithoutTitle}\n\n</Accordion>`;
};

// Remove horizontal dividers between members
const customMembers = (context: MarkdownThemeRenderContext, container: ContainerReflection) =>
    members(context, container).replace(/\n\n---/g, "");

export const customPartials = (context: MarkdownThemeRenderContext) => {
    return {
        ...partials(context),
        member: (ref: DeclarationReflection) => customMember(context, ref),
        members: (container: ContainerReflection) => customMembers(context, container)
    };
};
