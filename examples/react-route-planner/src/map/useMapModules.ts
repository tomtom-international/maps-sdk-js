import { TomTomConfig } from '@tomtom-org/maps-sdk/core';
import {
    type BaseMapEvents,
    BaseMapModule,
    PlacesModule,
    POIsModule,
    RoutingModule,
    type StandardStyleID,
    TomTomMap,
} from '@tomtom-org/maps-sdk/map';
import { useEffect, useState } from 'react';
import { API_KEY } from '../config';

export type MapModules = {
    map: TomTomMap;
    routing: RoutingModule;
    /** The search results, kept apart from the stops the routing module draws. */
    searchResults: PlacesModule;
    baseMap: BaseMapModule;
    /**
     * The base map's events under the route lines alone: its labels, shields and 3D buildings are drawn above them, so
     * listening to those would take the hover off a route beneath.
     */
    baseMapUnderRoutes: ReturnType<BaseMapEvents['where']>;
    pois: POIsModule;
};

// (Set your own API key when working in your own environment)
TomTomConfig.instance.put({ apiKey: API_KEY, language: 'en-GB' });

export const useMapModules = (initialStyle: StandardStyleID): MapModules | undefined => {
    const [modules, setModules] = useState<MapModules>();
    const [style] = useState(initialStyle);

    useEffect(() => {
        const map = new TomTomMap({
            mapLibre: {
                container: 'sdk-map',
                center: [7.6, 46.2],
                zoom: 7.5,
                // The fly-over's depth of field reads the rendered map back as a texture, which
                // MapLibre allows only when asked.
                canvasContextAttributes: { preserveDrawingBuffer: true },
            },
            style,
        });
        let disposed = false;

        (async () => {
            const [routing, searchResults, baseMap, pois] = await Promise.all([
                // The panel lists every route with its time, so the map labels the alternatives alone.
                RoutingModule.create(map, {
                    summaryBubbles: {
                        routes: 'alternatives',
                        fields: ['durationDifference', 'trafficDelay'],
                    },
                }),
                PlacesModule.create(map),
                // Any spot can join the route, but only features read as clickable.
                BaseMapModule.get(map, { events: { cursorOnHover: 'default' } }),
                POIsModule.get(map),
            ]);
            const baseMapUnderRoutes = baseMap.events.where({
                layerGroups: {
                    show: 'only',
                    values: ['land', 'water', 'buildings2D', 'roads', 'railways', 'ferries', 'borders'],
                },
            });
            if (!disposed) setModules({ map, routing, searchResults, baseMap, baseMapUnderRoutes, pois });
        })();

        return () => {
            disposed = true;
            setModules(undefined);
            map.mapLibreMap.remove();
        };
    }, [style]);

    return modules;
};
