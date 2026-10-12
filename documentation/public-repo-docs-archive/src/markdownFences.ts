/** Lines of a Markdown document outside any fenced block. */
export type ProseSegment = { kind: 'prose'; rawLines: string[] };

/** A fenced block of a Markdown document. */
export type FenceSegment = {
    kind: 'fence';
    /** The fence's info word, lower-cased; empty for a bare fence. */
    language: string;
    /** The words after the language, e.g. `['doc-resolution-skip']`. */
    meta: string[];
    /** The block as the document writes it, its fence lines included. */
    rawLines: string[];
    /** The code between the fence lines, with the indentation of a fence nested in a list item stripped. */
    codeLines: string[];
    /** 1-based line, in the document, of the block's first code line. */
    firstCodeLine: number;
    /** False for a fence that the document never closes. */
    closed: boolean;
};

export type MarkdownSegment = ProseSegment | FenceSegment;

/** The document as its prose and fenced segments, in document order; together they hold every line. */
export const splitAtFences = (markdown: string): MarkdownSegment[] => {
    const segments: MarkdownSegment[] = [];
    let openFence: { marker: string; indent: number; segment: FenceSegment } | undefined;
    for (const [index, line] of markdown.split(/\r?\n/).entries()) {
        if (openFence) {
            openFence.segment.rawLines.push(line);
            if (closesFence(openFence.marker, line)) {
                openFence.segment.closed = true;
                openFence = undefined;
            } else {
                const indent = Math.min(openFence.indent, line.length - line.trimStart().length);
                openFence.segment.codeLines.push(line.slice(indent));
            }
            continue;
        }
        const opening = fenceOpeningPattern.exec(line);
        if (opening) {
            const [, indent, marker, info] = opening;
            const [language = '', ...meta] = info.trim() ? info.trim().split(/\s+/) : [];
            const segment: FenceSegment = {
                kind: 'fence',
                language: language.toLowerCase(),
                meta,
                rawLines: [line],
                codeLines: [],
                firstCodeLine: index + 2,
                closed: false,
            };
            segments.push(segment);
            openFence = { marker, indent: indent.length, segment };
            continue;
        }
        const lastSegment = segments.at(-1);
        if (lastSegment?.kind === 'prose') lastSegment.rawLines.push(line);
        else segments.push({ kind: 'prose', rawLines: [line] });
    }
    return segments;
};

const fenceOpeningPattern = /^(\s*)(`{3,}|~{3,})([^`~]*)$/;

const closesFence = (marker: string, line: string): boolean => {
    const trimmed = line.trim();
    return trimmed.length >= marker.length && trimmed === marker[0].repeat(trimmed.length);
};
