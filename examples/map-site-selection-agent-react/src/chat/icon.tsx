// Safe: `raw` is always a bundled SVG import, never user input.
export function Icon({ raw }: { raw: string }) {
    return <span style={{ display: 'contents' }} dangerouslySetInnerHTML={{ __html: raw }} />;
}
