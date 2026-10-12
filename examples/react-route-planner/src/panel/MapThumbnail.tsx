import type { LookSwatch } from '../mapLook/looks';

/** A tiny drawn map in a look's colours: land, a lake, two roads and a route. */
export const MapThumbnail = ({ swatch, route = false }: { swatch: LookSwatch; route?: boolean }) => (
    <svg className="ui-map-thumbnail" viewBox="0 0 64 48" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <rect width="64" height="48" fill={swatch.land} />
        <path d="M38 0h26v24c-9 3-17 0-22-8z" fill={swatch.water} />
        <path d="M0 33l24-6 40 9" stroke={swatch.road} strokeWidth="3" fill="none" />
        <path d="M16 48l10-26L34 0" stroke={swatch.roadMajor} strokeWidth="4" fill="none" />
        {route && (
            <path
                d="M6 42c8-2 12-12 20-14s14 4 22-2"
                stroke={swatch.accent}
                strokeWidth="3"
                strokeLinecap="round"
                fill="none"
            />
        )}
    </svg>
);
