import { isNil } from 'lodash-es';
import type { FillLayerSpecification, LineLayerSpecification, SymbolLayerSpecification } from 'maplibre-gl';
import type { LayerSpecTemplate, SymbolLayerSpecWithoutSource } from '../../shared';
import { MAP_BOLD_FONT } from '../../shared/layers/commonLayerProps';
import type { GeometriesModuleConfig } from '../types/geometriesModuleConfig';
import {
    BORDER_LABEL_MIN_ZOOM,
    BORDER_LABEL_SYMBOL_SPACING,
    BORDER_LABEL_TEXT_HALO_WIDTH,
    BORDER_LABEL_TEXT_SIZE,
    DEFAULT_COLOR,
    DEFAULT_FILL_OPACITY,
    DEFAULT_LINE_OPACITY,
    DEFAULT_LINE_WIDTH,
    OUTLINE_THEME_FILL_OPACITY,
    OUTLINE_THEME_LINE_COLOR,
    OUTLINE_THEME_LINE_OPACITY,
    OUTLINE_THEME_LINE_WIDTH,
    TITLE_COLOR,
    TITLE_HALO_COLOR,
    TITLE_PADDING,
    TITLE_SIZE,
} from './constants';

/**
 * @ignore
 */
export const geometryFillSpec: LayerSpecTemplate<FillLayerSpecification> = {
    type: 'fill',
    paint: {
        'fill-color': ['coalesce', ['get', 'color'], DEFAULT_COLOR],
        'fill-opacity': ['case', ['==', ['get', 'theme'], 'outline'], OUTLINE_THEME_FILL_OPACITY, DEFAULT_FILL_OPACITY],
        'fill-antialias': false,
    },
};

/**
 * @ignore
 */
export const geometryOutlineSpec: LayerSpecTemplate<LineLayerSpecification> = {
    type: 'line',
    paint: {
        'line-color': [
            'case',
            ['==', ['get', 'theme'], 'outline'],
            ['coalesce', ['get', 'color'], OUTLINE_THEME_LINE_COLOR],
            ['coalesce', ['get', 'color'], DEFAULT_COLOR],
        ],
        'line-opacity': ['case', ['==', ['get', 'theme'], 'outline'], OUTLINE_THEME_LINE_OPACITY, DEFAULT_LINE_OPACITY],
        'line-width': ['case', ['==', ['get', 'theme'], 'outline'], OUTLINE_THEME_LINE_WIDTH, DEFAULT_LINE_WIDTH],
    },
};

/**
 * Builds Geometry layer specifications for fill and outline layers.
 * @ignore
 */
export const buildGeometryLayerSpecs = (
    fillLayerId: string,
    outlineLayerId: string,
    config?: GeometriesModuleConfig,
): [SymbolLayerSpecWithoutSource, SymbolLayerSpecWithoutSource] => {
    const fill = config?.fill;
    const line = config?.line;

    const fillLayerSpec = {
        ...geometryFillSpec,
        id: fillLayerId,
        paint: {
            ...geometryFillSpec.paint,
            ...(!isNil(fill?.opacity) && { 'fill-opacity': fill?.opacity }),
            ...(fill?.color && { 'fill-color': ['get', 'color'] }),
        },
    } as unknown as SymbolLayerSpecWithoutSource;

    // `line.layer` is a full-spec escape hatch: merge it onto the outline layer first
    // (top-level, then `layout`/`paint` per property so base defaults survive), then let the
    // curated named fields below win over any paint property it sets.
    const linePassthrough = line?.layer;

    const outlineLayerSpec = {
        ...geometryOutlineSpec,
        ...linePassthrough,
        id: outlineLayerId,
        ...(linePassthrough?.layout && { layout: { ...geometryOutlineSpec.layout, ...linePassthrough.layout } }),
        paint: {
            ...geometryOutlineSpec.paint,
            ...linePassthrough?.paint,
            ...(!isNil(line?.color) && { 'line-color': line?.color }),
            ...(!isNil(line?.width) && { 'line-width': line?.width }),
            ...(!isNil(line?.opacity) && { 'line-opacity': line?.opacity }),
        },
    } as unknown as SymbolLayerSpecWithoutSource;

    return [fillLayerSpec, outlineLayerSpec];
};

/**
 * Build geometry layer specification for title.
 * @ignore
 */
export const buildGeometryTitleLayerSpec = (
    layerId: string,
    config?: GeometriesModuleConfig,
): Omit<SymbolLayerSpecification, 'source'> => {
    const textConfig = config?.textConfig;

    return {
        type: 'symbol',
        id: layerId,
        layout: {
            'text-field': ['get', 'title'],
            ...(textConfig?.textField && { 'text-field': textConfig.textField }),
            'text-padding': TITLE_PADDING,
            'text-size': TITLE_SIZE,
            'text-font': [MAP_BOLD_FONT],
            'symbol-placement': 'point',
        },
        paint: {
            'text-color': TITLE_COLOR,
            'text-halo-color': TITLE_HALO_COLOR,
            'text-halo-width': ['interpolate', ['linear'], ['zoom'], 6, 1, 10, 1.5],
            'text-translate-anchor': 'viewport',
        },
    };
};

/**
 * Build geometry layer specification for line labels.
 * Adds labels along the polygon border.
 * @ignore
 */
export const buildGeometryLineLabelLayerSpec = (
    layerId: string,
    config?: GeometriesModuleConfig,
): Omit<SymbolLayerSpecification, 'source'> => {
    const lineLabelConfig = config?.lineLabelConfig;
    const minzoom = lineLabelConfig?.minZoom ?? BORDER_LABEL_MIN_ZOOM;

    return {
        type: 'symbol',
        id: layerId,
        minzoom,
        layout: {
            'text-field': ['get', 'title'],
            'symbol-placement': 'line',
            'text-size': lineLabelConfig?.textSize ?? BORDER_LABEL_TEXT_SIZE,
            'text-font': [MAP_BOLD_FONT],
            'symbol-spacing': lineLabelConfig?.symbolSpacing ?? BORDER_LABEL_SYMBOL_SPACING,
            'text-keep-upright': true,
            'text-offset': lineLabelConfig?.textOffset ?? [0, 1],
        },
        paint: {
            'text-color': lineLabelConfig?.textColor ?? TITLE_COLOR,
            'text-halo-color': lineLabelConfig?.textHaloColor ?? TITLE_HALO_COLOR,
            'text-halo-width': lineLabelConfig?.textHaloWidth ?? BORDER_LABEL_TEXT_HALO_WIDTH,
            ...(!isNil(lineLabelConfig?.textOpacity) && { 'text-opacity': lineLabelConfig?.textOpacity }),
        },
    };
};
