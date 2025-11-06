/**
 * Used to import raw SVG files as strings.
 */
declare module '*.svg?raw' {
    const content: string;
    export default content;
}
