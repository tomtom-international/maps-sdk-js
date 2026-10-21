import type { SVGProps } from 'react';

/**
 * TomTom-flavoured monochrome icons for the side panels.
 *
 * All icons render at the parent's font-size (1em) and use `currentColor` so they pick up the
 * surrounding Tailwind text-color classes. They follow the SDK example aesthetic: 1.6 px stroke,
 * round line caps/joins, single colour, 24×24 viewBox.
 */
type IconProps = Omit<SVGProps<SVGSVGElement>, 'children'>;

const baseProps: IconProps = {
    width: '1em',
    height: '1em',
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.6,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': true,
    focusable: false,
};

export const MenuIcon = (props: IconProps) => (
    <svg {...baseProps} {...props}>
        <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
);

export const CloseIcon = (props: IconProps) => (
    <svg {...baseProps} {...props}>
        <path d="M6 6l12 12M18 6l-12 12" />
    </svg>
);

export const ChevronRightIcon = (props: IconProps) => (
    <svg {...baseProps} {...props}>
        <path d="M9 6l6 6-6 6" />
    </svg>
);

export const PinIcon = (props: IconProps) => (
    <svg {...baseProps} {...props}>
        <path d="M12 21s-7-7.5-7-12a7 7 0 0 1 14 0c0 4.5-7 12-7 12z" />
        <circle cx="12" cy="9" r="2.6" />
    </svg>
);

export const RouteIcon = (props: IconProps) => (
    <svg {...baseProps} {...props}>
        <circle cx="6" cy="6" r="2.4" />
        <circle cx="18" cy="18" r="2.4" />
        <path d="M6 8.5v6a3.5 3.5 0 0 0 3.5 3.5H15" />
    </svg>
);

export const RangeIcon = (props: IconProps) => (
    <svg {...baseProps} {...props}>
        <circle cx="12" cy="12" r="8.5" />
        <path d="M12 7v5l3.5 2.2" />
    </svg>
);

export const GeometriesIcon = (props: IconProps) => (
    <svg {...baseProps} {...props}>
        <path d="M4 8l8-4 8 4-8 4z" />
        <path d="M4 8v8l8 4 8-4V8" />
        <path d="M12 12v8" />
    </svg>
);

export const ByodIcon = (props: IconProps) => (
    <svg {...baseProps} {...props}>
        <ellipse cx="12" cy="6" rx="7" ry="3" />
        <path d="M5 6v6c0 1.7 3.1 3 7 3s7-1.3 7-3V6" />
        <path d="M5 12v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6" />
    </svg>
);

export const TagIcon = (props: IconProps) => (
    <svg {...baseProps} {...props}>
        <path d="M3.5 12.5L11 5h7v7l-7.5 7.5a1.6 1.6 0 0 1-2.3 0l-4.7-4.7a1.6 1.6 0 0 1 0-2.3z" />
        <circle cx="14.7" cy="9.3" r="1.2" />
    </svg>
);

export const LayersIcon = (props: IconProps) => (
    <svg {...baseProps} {...props}>
        <path d="M12 3.5l9 5-9 5-9-5 9-5z" />
        <path d="M3 13.5l9 5 9-5" />
    </svg>
);

export const IncidentsIcon = (props: IconProps) => (
    <svg {...baseProps} {...props}>
        <path d="M12 3.5L21 19.5H3z" />
        <path d="M12 10v4" />
        <circle cx="12" cy="17" r="0.8" fill="currentColor" stroke="none" />
    </svg>
);

export const AnalyticsIcon = (props: IconProps) => (
    <svg {...baseProps} {...props}>
        <path d="M4 20h16" />
        <path d="M7 16v-4" />
        <path d="M12 16V8" />
        <path d="M17 16v-6" />
    </svg>
);

export const ChartIcon = (props: IconProps) => (
    <svg {...baseProps} {...props}>
        <path d="M5 3v16a2 2 0 0 0 2 2h14" />
        <path d="M18 8l-4 5-3-2-3 4" />
    </svg>
);

export const SignalIcon = (props: IconProps) => (
    <svg {...baseProps} {...props}>
        <path d="M5.5 18.5a9 9 0 0 1 13 0" />
        <path d="M8 15.5a5.5 5.5 0 0 1 8 0" />
        <circle cx="12" cy="13.5" r="1.4" />
        <path d="M3 21.5h18" />
    </svg>
);

export const EyeOffIcon = (props: IconProps) => (
    <svg {...baseProps} {...props}>
        <path d="M3 3l18 18" />
        <path d="M10.6 5.2A11 11 0 0 1 12 5c5 0 9 4 10 7-0.5 1.5-1.7 3.4-3.6 4.9" />
        <path d="M6.6 6.6C4.5 8 3.4 9.8 3 11c1 3 5 7 10 7 1.4 0 2.7-.3 3.9-.8" />
        <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
    </svg>
);

export const RefreshIcon = (props: IconProps) => (
    <svg {...baseProps} {...props}>
        <path d="M20 12a8 8 0 1 1-2.3-5.6" />
        <path d="M20 4v4h-4" />
    </svg>
);

export const EyeIcon = (props: IconProps) => (
    <svg {...baseProps} {...props}>
        <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
        <circle cx="12" cy="12" r="3" />
    </svg>
);

export const SelectionIcon = (props: IconProps) => (
    <svg {...baseProps} {...props}>
        <path d="M3 3l7 18 2.5-7.5L20 11 3 3z" />
    </svg>
);

export const TrashIcon = (props: IconProps) => (
    <svg {...baseProps} {...props}>
        <path d="M4 7h16" />
        <path d="M9 7V4h6v3" />
        <path d="M6 7l1 13a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-13" />
        <path d="M10 11v7M14 11v7" />
    </svg>
);
