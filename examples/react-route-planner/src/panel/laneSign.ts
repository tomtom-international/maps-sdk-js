import type { LaneSectionProps, PossibleLaneDirection } from '@tomtom-org/maps-sdk/core';

// Each direction's turn, clockwise from straight ahead; ±180 is a U-turn to that side.
const DEGREES: Record<PossibleLaneDirection, number> = {
    STRAIGHT: 0,
    SLIGHT_RIGHT: 45,
    RIGHT: 90,
    SHARP_RIGHT: 135,
    RIGHT_U_TURN: 180,
    SLIGHT_LEFT: -45,
    LEFT: -90,
    SHARP_LEFT: -135,
    LEFT_U_TURN: -180,
};
const LANE_WIDTH = 18;

const xy = (x: number, y: number) => `${+x.toFixed(1)} ${+y.toFixed(1)}`;

// An arrow leaving the top of its lane's stem. Turns bend lower than straight on, so in a lane with both
// the heads sit apart; a U-turn hairpins down to its side.
const arrow = (x: number, degrees: number): string => {
    if (Math.abs(degrees) === 180) {
        const side = Math.sign(degrees);
        return `M${x} 15V9a3 3 0 0 ${side > 0 ? 1 : 0} ${side * 6} 0v5m-3-3 3 3 3-3`;
    }
    const radians = (degrees * Math.PI) / 180;
    const [dx, dy] = [Math.sin(radians), -Math.cos(radians)];
    // A sharp turn heads back down, so it leaves the stem higher, in a straight line clear of it.
    const isSharp = Math.abs(degrees) > 90;
    const bend = isSharp ? 6 : degrees ? 12 : 9;
    const reach = isSharp ? 9 : 6;
    const [tipX, tipY] = [x + dx * reach, bend + dy * reach];
    const tip = xy(tipX, tipY);
    const head = (side: number) => xy(tipX - (dx + dy * side) * 2.75, tipY - (dy - dx * side) * 2.75);
    return `M${x} 15${isSharp ? `V${bend}L` : `Q${x} ${bend} `}${tip}M${head(1)}L${tip}L${head(-1)}`;
};

/**
 * A `lanes` section as an SVG sign in the text colour around it: the lanes to take in full, the others
 * faded. None for a section naming no lane to take.
 */
export const laneSign = ({ lanes }: LaneSectionProps): string | undefined => {
    const followed: string[] = [];
    const other: string[] = [];
    lanes.forEach(({ directions, follow }, index) => {
        const x = (index + 0.5) * LANE_WIDTH;
        const known = directions.filter((direction) => direction in DEGREES);
        if (!known.length) return;

        (known.some((direction) => direction === follow) ? followed : other).push(`M${x} 21V15`);
        for (const direction of known) (direction === follow ? followed : other).push(arrow(x, DEGREES[direction]));
    });
    if (!followed.length) return undefined;

    const width = lanes.length * LANE_WIDTH;
    // One path per look, so faded strokes crossing each other don't darken where they overlap.
    return `<svg xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Lanes to take" width="${width}" height="24" viewBox="0 0 ${width} 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="${other.join('')}" opacity=".35"/><path d="${followed.join('')}"/></svg>`;
};
