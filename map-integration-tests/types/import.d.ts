// We need this for now because of type check dependencies with SDK SVG assets themselves.
declare module '*.svg' {
    const value: any;
    export default value;
}
