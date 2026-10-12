import { TomTomConfig } from '@tomtom-org/maps-sdk/core';
import {
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
    pois: POIsModule;
};

// (Set your own API key when working in your own environment)
TomTomConfig.instance.put({ apiKey: API_KEY, language: 'en-GB' });

export const useMapModules = (initialStyle: StandardStyleID): MapModules | undefined => {
    const [modules, setModules] = useState<MapModules>();
    const [style] = useState(initialStyle);

    useEffect(() => {
        const map = new TomTomMap({ mapLibre: { container: 'sdk-map', center: [7.6, 46.2], zoom: 7.5 }, style });
        let disposed = false;

        (async () => {
            const [routing, searchResults, baseMap, pois] = await Promise.all([
                RoutingModule.create(map),
                PlacesModule.create(map),
                // Any spot can join the route, but only features read as clickable.
                BaseMapModule.get(map, { events: { cursorOnHover: 'default' } }),
                POIsModule.get(map),
            ]);
            if (!disposed) setModules({ map, routing, searchResults, baseMap, pois });
        })();

        return () => {
            disposed = true;
            setModules(undefined);
            map.mapLibreMap.remove();
        };
    }, [style]);

    return modules;
};
