import type { ExpressionSpecification } from 'maplibre-gl';

/**
 * @ignore
 */
export const isClickEventState: ExpressionSpecification = [
    'in',
    ['get', 'eventState'],
    ['literal', ['click', 'contextmenu']],
];
