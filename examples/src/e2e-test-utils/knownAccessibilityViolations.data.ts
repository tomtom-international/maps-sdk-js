/**
 * The serious and critical axe-core rules each example breaks today, by example name.
 *
 * - **A new one fails the sanity test**: fix it rather than add it here.
 * - **So does a fixed one still listed**: delete it in the same PR.
 * - Most `color-contrast` entries are the templates' `--ui-text-low-em`, `#959595`, at 3:1 on white
 *   where its small text needs 4.5:1.
 */
export const KNOWN_ACCESSIBILITY_VIOLATIONS: Readonly<Record<string, readonly string[]>> = {
    'attribution-playground': ['color-contrast'],
    'display-units': ['color-contrast'],
    'geopolitical-views-playground': ['color-contrast'],
    'map-chat-agent-react': ['aria-prohibited-attr'],
    'map-chat-agent-state-playground': ['aria-prohibited-attr'],
    'map-site-selection-agent-react': ['aria-prohibited-attr'],
    'map-traffic-agent-react': ['aria-prohibited-attr'],
    'multiple-maps-landmarks': ['color-contrast'],
    'place-entry-points-playground': ['color-contrast'],
    'places-clustering-playground': ['color-contrast'],
    'places-customize-playground': ['label'],
    'react-route-planner': ['color-contrast', 'target-size'],
    'rev-geo-playground': ['color-contrast'],
    'route-departure-time': ['color-contrast'],
    'route-sections-playground': ['color-contrast', 'label', 'select-name', 'target-size'],
    'route-styling-playground': ['label'],
    'route-waypoints-playground': ['color-contrast'],
    'terrain-playground': ['color-contrast'],
    'traffic-area-analytics-config-playground': ['label', 'select-name'],
    'traffic-config-playground': ['color-contrast'],
    'traffic-incident-details': ['color-contrast'],
};
