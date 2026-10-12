import { Building, createLucideIcon, Leaf, type LucideIcon, Milestone, Repeat, Tractor, Users } from 'lucide-react';

const SQUARE = 'M5 1h14q4 0 4 4v14q0 4-4 4H5q-4 0-4-4V5q0-4 4-4z';
const DISC = 'M12 1a11 11 0 1 1 0 22 11 11 0 0 1 0-22z';
const COIN = 'h5.5a.75.75 0 0 1 0 1.5h-5.5a.75.75 0 0 1 0-1.5z';

/** A filled sign with its glyph cut out of it, so the glyph shows whatever it sits on. */
const mapSign = (name: string, d: string): LucideIcon =>
    createLucideIcon(name, [
        ['path', { d, fill: 'currentColor', stroke: 'none', fillRule: 'evenodd', className: 'ui-map-sign', key: name }],
    ]);

/** The tunnel sign the route posts where a tunnel starts. */
const Tunnel = mapSign('tunnel', `${SQUARE}M5 19v-6.5a7 7 0 0 1 14 0V19h-3.2v-6.3a3.8 3.8 0 0 0-7.6 0V19z`);

/** The map's ferry terminal. */
const Ferry = mapSign(
    'ferry',
    `${SQUARE}M7 16l-2-4h3V8h3V5h2v3h3v4h3l-2 4zm-2 2.8q1.75-1 3.5 0t3.5 0 3.5 0 3.5 0v1.8q-1.75-1-3.5 0t-3.5 0-3.5 0-3.5 0z`,
);

/** The map's railway station, as the map draws no car train of its own. */
const CarTrain = mapSign(
    'car-train',
    `${SQUARE}M9 4h6q2 0 2 2v9.5H7V6q0-2 2-2zM9 7v4h6V7zM8.5 12.5H10V14H8.5zm5.5 0h1.5V14H14zM8 16.5h2L8.5 20h-2zm6 0h2l1.5 3.5h-2z`,
);

/** The map's toll plaza. */
const Toll = mapSign(
    'toll',
    `${DISC}M9.5 6h9v5.5h-9zm4.5 1.25a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zM6.25 12.5${COIN}m0 2.5${COIN}m0 2.5${COIN}`,
);

/** The jam the route marks its traffic with. */
const TrafficJam = mapSign(
    'traffic-jam',
    `${DISC}M11 6h6l1.5 3v3.5H17V14h-1.5V9h-6zm.6 1h4.8l.75 1.5h-6.3zM7 10h6l1.5 3v3.5H13V18h-1.5v-1.5h-3V18H7v-1.5H5.5V13zm.6 1h4.8l1 2H6.6zm-.85 3h1.5v1h-1.5zm5.5 0h1.5v1h-1.5z`,
);

/** The plaque the route writes a border crossing on, such as "IT → CH". */
const BorderPlaque = mapSign(
    'border-plaque',
    'M3 6h18q2 0 2 2v8q0 2-2 2H3q-2 0-2-2V8q0-2 2-2zm4 5h6.5V9l4 3-4 3v-2H7z',
);

/**
 * The road features a route can take, one icon each wherever the planner names them. Those the map
 * draws an icon for look like it.
 */
export const roadIcons = {
    traffic: TrafficJam,
    motorway: Milestone,
    toll: Toll,
    tunnel: Tunnel,
    ferry: Ferry,
    carTrain: CarTrain,
    lowEmissionZone: Leaf,
    urban: Building,
    unpaved: Tractor,
    country: BorderPlaque,
    carpool: Users,
    repeat: Repeat,
} satisfies Record<string, LucideIcon>;
