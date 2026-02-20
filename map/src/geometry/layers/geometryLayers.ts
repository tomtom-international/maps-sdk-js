import type { FillLayerSpecification, LineLayerSpecification } from 'maplibre-gl';
import type { LayerSpecTemplate } from '../../shared';
import { GEOMETRY_COLOR_PROP } from '../types/geometryDisplayProps';

export type { ColorPaletteOptions } from './colorPalettes';

const defaultColor = '#0A3653';

/**
 * @ignore
 */
export const geometryFillSpec: LayerSpecTemplate<FillLayerSpecification> = {
    type: 'fill',
    paint: {
        'fill-color': ['coalesce', ['get', GEOMETRY_COLOR_PROP], defaultColor],
        'fill-opacity': 0.15,
        'fill-antialias': false,
    },
};

/**
 * @ignore
 */
export const geometryOutlineSpec: LayerSpecTemplate<LineLayerSpecification> = {
    type: 'line',
    paint: {
        'line-color': defaultColor,
        'line-opacity': 0.45,
        'line-width': 2,
    },
};
