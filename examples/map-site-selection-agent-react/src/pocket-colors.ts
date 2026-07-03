// Distinct, nameable fill colours for whitespace pockets, so the agent can refer to a pocket by its
// colour ("the teal pocket") instead of a number. Read by the geometry fill layer's ['get','color'];
// shared by find-whitespace (hex fill) and the WhitespacePanel (row swatch) so map, panel, and chat
// agree. Ordered by rank (best first); cycles if there are more pockets than colours.
export const POCKET_COLORS = [
    { hex: '#0E7C86', name: 'teal' },
    { hex: '#E8833A', name: 'orange' },
    { hex: '#7C5CBF', name: 'purple' },
    { hex: '#D64550', name: 'red' },
    { hex: '#3F8E44', name: 'green' },
    { hex: '#2F6FB0', name: 'blue' },
    { hex: '#C0529C', name: 'pink' },
    { hex: '#9A6A34', name: 'brown' },
] as const;

export const pocketColor = (index: number): { hex: string; name: string } =>
    POCKET_COLORS[index % POCKET_COLORS.length];
