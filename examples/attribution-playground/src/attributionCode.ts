import type { PanelAttribution } from './panel';

const DEFAULT_PADDING = { horizontal: 12, vertical: 8 };

// `sheetHeight` is the part of the vertical padding that clears the bottom sheet, spelled out as a sum.
const paddingCode = (
    { horizontal, vertical }: { horizontal: number; vertical: number },
    sheetHeight: number,
): string | undefined => {
    if (sheetHeight > 0) {
        const sheetVertical = `vertical: ${sheetHeight} + ${vertical - sheetHeight}`;
        return horizontal === DEFAULT_PADDING.horizontal
            ? `{ ${sheetVertical} }`
            : `{ horizontal: ${horizontal}, ${sheetVertical} }`;
    }
    if (horizontal === DEFAULT_PADDING.horizontal && vertical === DEFAULT_PADDING.vertical) return undefined;
    if (horizontal === vertical) return `${horizontal}`;

    const changed = [
        horizontal !== DEFAULT_PADDING.horizontal && `horizontal: ${horizontal}`,
        vertical !== DEFAULT_PADDING.vertical && `vertical: ${vertical}`,
    ];
    return `{ ${changed.filter(Boolean).join(', ')} }`;
};

const quoted = (text: string): string => `'${text.replaceAll('\\', '\\\\').replaceAll("'", "\\'")}'`;

/** The shortest `attribution` option that asks for the same as `attribution`, as you'd write it. */
export const attributionCode = (
    { position, padding, credits, backdrop }: PanelAttribution,
    sheetHeight: number,
): string => {
    const paddingValue = paddingCode(padding, sheetHeight);
    const lines = [
        position !== 'bottom-right' && `position: '${position}'`,
        paddingValue && `padding: ${paddingValue}`,
        credits.length > 0 && `credits: [${credits.map(quoted).join(', ')}]`,
        !backdrop && 'backdrop: false',
    ].filter((line): line is string => typeof line === 'string');

    if (lines.length === 0) return '// The default: logos in the bottom-right corner';

    return `attribution: {\n${lines.map((line) => `    ${line},`).join('\n')}\n}`;
};
