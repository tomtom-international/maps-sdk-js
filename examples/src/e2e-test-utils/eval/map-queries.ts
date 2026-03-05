import type { Page } from '@playwright/test';
import type { Map as MapLibreMap } from 'maplibre-gl';

const serializePattern = (pattern: RegExp) => ({ source: pattern.source, flags: pattern.flags });

export const waitForMapIdle = async (page: Page): Promise<void> => {
    await page.evaluate(async () => {
        const map = (globalThis as unknown as { __maplibreMap?: MapLibreMap }).__maplibreMap;
        if (!map) {
            throw new Error('window.__maplibreMap is not available. Ensure VITE_EVAL_MODE=true and eval hooks are enabled.');
        }

        if (map.loaded() && (typeof map.areTilesLoaded !== 'function' || map.areTilesLoaded())) {
            return;
        }

        await new Promise<void>((resolve) => {
            map.once('idle', () => resolve());
        });
    });
};

export const getSourceIds = async (page: Page): Promise<string[]> => {
    return page.evaluate(() => {
        const map = (globalThis as unknown as { __maplibreMap?: MapLibreMap }).__maplibreMap;
        if (!map) {
            throw new Error('window.__maplibreMap is not available. Ensure VITE_EVAL_MODE=true and eval hooks are enabled.');
        }
        return Object.keys(map.getStyle().sources ?? {});
    });
};

export const hasSourceMatching = async (page: Page, pattern: RegExp): Promise<boolean> => {
    const serialized = serializePattern(pattern);
    return page.evaluate((inputPattern) => {
        const map = (globalThis as unknown as { __maplibreMap?: MapLibreMap }).__maplibreMap;
        if (!map) {
            throw new Error('window.__maplibreMap is not available. Ensure VITE_EVAL_MODE=true and eval hooks are enabled.');
        }
        const regex = new RegExp(inputPattern.source, inputPattern.flags);
        const sourceIds = Object.keys(map.getStyle().sources ?? {});
        return sourceIds.some((sourceId) => regex.test(sourceId));
    }, serialized);
};

export const getLayerCountBySource = async (page: Page, sourceId: string): Promise<number> => {
    return page.evaluate((inputSourceId) => {
        const map = (globalThis as unknown as { __maplibreMap?: MapLibreMap }).__maplibreMap;
        if (!map) {
            throw new Error('window.__maplibreMap is not available. Ensure VITE_EVAL_MODE=true and eval hooks are enabled.');
        }
        const layers = map.getStyle().layers ?? [];
        return layers.filter((layer) => 'source' in layer && layer.source === inputSourceId).length;
    }, sourceId);
};

export const getVisibleLayerIds = async (page: Page): Promise<string[]> => {
    return page.evaluate(() => {
        const map = (globalThis as unknown as { __maplibreMap?: MapLibreMap }).__maplibreMap;
        if (!map) {
            throw new Error('window.__maplibreMap is not available. Ensure VITE_EVAL_MODE=true and eval hooks are enabled.');
        }
        const layers = map.getStyle().layers ?? [];
        return layers.filter((layer) => layer.layout?.visibility !== 'none').map((layer) => layer.id);
    });
};

export const queryRenderedFeaturesCount = async (page: Page, layerPattern?: RegExp): Promise<number> => {
    const serialized = layerPattern ? serializePattern(layerPattern) : null;
    return page.evaluate((inputPattern) => {
        const map = (globalThis as unknown as { __maplibreMap?: MapLibreMap }).__maplibreMap;
        if (!map) {
            throw new Error('window.__maplibreMap is not available. Ensure VITE_EVAL_MODE=true and eval hooks are enabled.');
        }
        const styleLayers = map.getStyle().layers ?? [];

        const layerIds = inputPattern
            ? styleLayers
                  .filter((layer) => new RegExp(inputPattern.source, inputPattern.flags).test(layer.id))
                  .map((layer) => layer.id)
            : undefined;

        if ((layerIds?.length ?? 0) === 0) {
            return 0;
        }

        const features = layerIds
            ? map.queryRenderedFeatures({ layers: layerIds, validate: false })
            : map.queryRenderedFeatures({ validate: false });

        return features.length;
    }, serialized);
};

export const getStyleName = async (page: Page): Promise<string> => {
    return page.evaluate(() => {
        const map = (globalThis as unknown as { __maplibreMap?: MapLibreMap }).__maplibreMap;
        if (!map) {
            throw new Error('window.__maplibreMap is not available. Ensure VITE_EVAL_MODE=true and eval hooks are enabled.');
        }
        return map.getStyle().name ?? '';
    });
};

export const getMapCenter = async (page: Page): Promise<[number, number]> => {
    return page.evaluate(() => {
        const map = (globalThis as unknown as { __maplibreMap?: MapLibreMap }).__maplibreMap;
        if (!map) {
            throw new Error('window.__maplibreMap is not available. Ensure VITE_EVAL_MODE=true and eval hooks are enabled.');
        }
        return map.getCenter().toArray();
    });
};

export const getMapZoom = async (page: Page): Promise<number> => {
    return page.evaluate(() => {
        const map = (globalThis as unknown as { __maplibreMap?: MapLibreMap }).__maplibreMap;
        if (!map) {
            throw new Error('window.__maplibreMap is not available. Ensure VITE_EVAL_MODE=true and eval hooks are enabled.');
        }
        return map.getZoom();
    });
};

export const isTrafficFlowVisible = async (page: Page): Promise<boolean> => {
    return page.evaluate(() => {
        const map = (globalThis as unknown as { __maplibreMap?: MapLibreMap }).__maplibreMap;
        if (!map) {
            throw new Error('window.__maplibreMap is not available. Ensure VITE_EVAL_MODE=true and eval hooks are enabled.');
        }
        const layers = map.getStyle().layers ?? [];

        const trafficLayers = layers.filter((layer) => /traffic|flow/i.test(layer.id));
        if (trafficLayers.length === 0) {
            return false;
        }

        return trafficLayers.some((layer) => layer.layout?.visibility !== 'none');
    });
};

export const getPaintProperty = async (page: Page, layerId: string, property: string): Promise<unknown> => {
    return page.evaluate(
        ({ inputLayerId, inputProperty }) => {
            const map = (globalThis as unknown as { __maplibreMap?: MapLibreMap }).__maplibreMap;
            if (!map) {
                throw new Error('window.__maplibreMap is not available. Ensure VITE_EVAL_MODE=true and eval hooks are enabled.');
            }
            return map.getPaintProperty(inputLayerId, inputProperty);
        },
        { inputLayerId: layerId, inputProperty: property },
    );
};
