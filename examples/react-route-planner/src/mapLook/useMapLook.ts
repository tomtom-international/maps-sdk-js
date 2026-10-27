import {
    StylingFoundationsModule,
    TerrainModule,
    TrafficFlowModule,
    TrafficIncidentsModule,
} from '@tomtom-org/maps-sdk/map';
import { useEffect, useRef, useState } from 'react';
import { errorMessage } from '../format';
import type { MapModules } from '../map/useMapModules';
import { useMapQueue } from '../map/useMapQueue';
import { hillshadeLooks, type MapLook, type POIFocus, poiFocuses, themes } from './looks';

/** Applies the fields that differ from the look applied before; everything, the first time. */
const applyLook = async ({ map, baseMap, pois }: MapModules, look: MapLook, previous?: MapLook) => {
    const changed = (...keys: (keyof MapLook)[]) => !previous || keys.some((key) => previous[key] !== look[key]);

    // A switch carries the routes, the places and every setting below onto the new style. Once a module adds
    // its style part, the style input is an object, so only the first look compares with it.
    const styleInput = map.getStyleInput();
    const currentStyle = typeof styleInput === 'string' ? styleInput : styleInput?.id;
    if (previous ? changed('style') : look.style !== currentStyle) await map.setStyle(look.style);

    if (changed('theme', 'labelSize', 'roadWidth', 'terrain')) {
        const styling = await StylingFoundationsModule.get(map);
        // `applyConfig` replaces every knob, so a theme left out goes back to the style's colours.
        styling.applyConfig({
            ...(look.theme && { colors: themes[look.theme].colors }),
            labels: { sizeFactor: look.labelSize },
            roads: { widthFactor: look.roadWidth },
            // The sky's fog fades the far relief that the fly-over's tilted 3D view looks out on.
            view: { sky: { visible: look.terrain } },
        });
    }

    // The traffic and terrain modules are created the first time they are needed.
    if (changed('trafficFlow') && (previous || look.trafficFlow)) {
        (await TrafficFlowModule.get(map)).setVisible(look.trafficFlow);
    }
    if (changed('trafficIncidents') && (previous || look.trafficIncidents)) {
        (await TrafficIncidentsModule.get(map)).setVisible(look.trafficIncidents);
    }
    if (changed('hillshade', 'terrain', 'exaggeration') && (previous || look.hillshade || look.terrain)) {
        const terrain = await TerrainModule.get(map);
        terrain.applyConfig({
            hillshade: look.hillshade
                ? { visible: true, ...hillshadeLooks[look.hillshade].hillshade }
                : { visible: false },
            elevation: { visible: look.terrain, exaggeration: look.exaggeration },
        });
    }
    if (changed('buildings3D')) {
        baseMap.setVisible(look.buildings3D, { layerGroups: { show: 'only', values: ['buildings3D'] } });
    }
    if (changed('pois')) {
        const { categories }: POIFocus = poiFocuses[look.pois];
        pois.setVisible(look.pois !== 'none');
        pois.updateConfig({ filters: categories && { categories: { show: 'only', values: categories } } });
    }
};

/**
 * Keeps the map in the given look. Applications run one at a time, and a look superseded while
 * waiting is skipped, so a dragged slider settles on its last value.
 */
export const useMapLook = (modules: MapModules | undefined, look: MapLook): string | undefined => {
    const [error, setError] = useState<string>();
    const applied = useRef<MapLook>(undefined);
    const latest = useRef(look);
    const enqueue = useMapQueue();

    useEffect(() => {
        if (!modules) return;

        latest.current = look;
        void enqueue(async () => {
            if (latest.current !== look) return;

            try {
                await applyLook(modules, look, applied.current);
                applied.current = look;
                setError(undefined);
            } catch (lookError) {
                setError(`Couldn't change the map: ${errorMessage(lookError)}`);
            }
        });
    }, [modules, look, enqueue]);

    return error;
};
