import { skipToken, useInfiniteQuery } from '@tanstack/react-query';
import type { Place, Route } from '@tomtom-org/maps-sdk/core';
import { type DiscoverPlacesResponse, discoverPlaces } from '@tomtom-org/maps-sdk/services';
import { useEffect, useMemo, useRef, useState } from 'react';
import { placeTitle } from '../format';
import { flyBetweenPanels } from '../map/coveringPanels';
import type { MapModules } from '../map/useMapModules';
import { requestFilters, type SearchRequest, type SearchScope, type StationFilters } from './searchRequest';

const RESULTS_PER_PAGE = 20;

type SearchPageParameters = {
    modules: MapModules;
    request: SearchRequest;
    stationFilters: StationFilters;
    /** Set for an along-route search, with the longest detour it allows. */
    alongRoute?: { route: Route; maxDetourMinutes: number };
    cursor?: string;
    signal: AbortSignal;
};

/** One page of results: a fuzzy search pages through a cursor, an along-route search answers at once. */
const searchPage = ({
    modules,
    request,
    stationFilters,
    alongRoute,
    cursor,
    signal,
}: SearchPageParameters): Promise<DiscoverPlacesResponse> => {
    const filters = requestFilters(request, stationFilters);
    const common = {
        ...(request.query && { query: request.query }),
        ...(filters && { filters }),
        limit: RESULTS_PER_PAGE,
        signal,
    };
    return alongRoute
        ? discoverPlaces({
              ...common,
              route: alongRoute.route,
              maxDetourTimeSeconds: alongRoute.maxDetourMinutes * 60,
              sortBy: 'detourOffset',
          })
        : discoverPlaces({ ...common, geoBias: { boundingBox: modules.map.getBBox() }, ...(cursor && { cursor }) });
};

/** The places found, minus those already on the route, shown on the map: a stop's pin stands for its place. */
const useShownPlaces = (modules: MapModules | undefined, found: Place[] | undefined, routePlaceIds: string[]) => {
    const routePlaceKey = routePlaceIds.join('|');
    const shownPlaces = useMemo(() => {
        const onRoute = new Set(routePlaceKey.split('|'));
        return found?.filter((place) => !onRoute.has(place.id)) ?? [];
    }, [found, routePlaceKey]);

    useEffect(() => {
        if (modules)
            void (shownPlaces.length ? modules.searchResults.show(shownPlaces) : modules.searchResults.clear());
    }, [modules, shownPlaces]);
    return shownPlaces;
};

/** Runs the current request in its scope, a page at a time. */
export const usePlaceSearch = (modules: MapModules | undefined, route: Route | undefined, routePlaceIds: string[]) => {
    const [request, setRequest] = useState<SearchRequest>();
    const [previewed, setPreviewed] = useState<Place>();
    const [scope, setScope] = useState<SearchScope>('map');
    const [maxDetourMinutes, setMaxDetourMinutes] = useState(10);
    const [stationFilters, setStationFilters] = useState<StationFilters>({});
    const [highlightedId, setHighlightedId] = useState<string>();
    // Each search is a run of its own, so searching again with the same request (after moving the map, say) fetches again.
    const [searchRun, setSearchRun] = useState(0);
    // Read at search time: a route recalculated by adding a result doesn't search again.
    const routeRef = useRef(route);
    useEffect(() => {
        routeRef.current = route;
    });
    const alongRoute = scope === 'route' && route !== undefined;

    const query = useInfiniteQuery({
        queryKey: ['places', request, searchRun, stationFilters, alongRoute && maxDetourMinutes],
        queryFn:
            modules && request
                ? ({ pageParam, signal }) =>
                      searchPage({
                          modules,
                          request,
                          stationFilters,
                          alongRoute:
                              alongRoute && routeRef.current
                                  ? { route: routeRef.current, maxDetourMinutes }
                                  : undefined,
                          cursor: pageParam,
                          signal,
                      })
                : skipToken,
        initialPageParam: undefined as string | undefined,
        getNextPageParam: (page) => page.properties?.nextCursor,
    });

    const found = useMemo(
        () => (request ? query.data?.pages.flatMap((page) => page.features) : previewed && [previewed]),
        [request, query.data, previewed],
    );
    const shownPlaces = useShownPlaces(modules, found, routePlaceIds);

    const showRequest = (next?: SearchRequest) => {
        setRequest(next);
        setPreviewed(undefined);
        setHighlightedId(undefined);
    };

    return {
        request,
        search: (next?: SearchRequest) => {
            setSearchRun((run) => run + 1);
            showRequest(next);
        },
        clear: () => showRequest(undefined),
        preview: (place: Place) => {
            showRequest(undefined);
            setPreviewed(place);
            if (modules) flyBetweenPanels(modules.map, place.geometry.coordinates, 14);
        },
        title: request?.title ?? (previewed && placeTitle(previewed)),
        places: found && shownPlaces,
        loadMore: request && query.hasNextPage ? () => void query.fetchNextPage() : undefined,
        searching: request !== undefined && query.isFetching,
        error: request && query.error?.message,
        scope,
        setScope,
        alongRoute,
        canSearchAlongRoute: route !== undefined,
        maxDetourMinutes,
        setMaxDetourMinutes,
        stationFilters,
        setStationFilters,
        highlightedId,
        setHighlightedId,
        /** From the list: the map pin follows. A hover on the pin itself sets only the id. */
        highlight: (place?: Place) => {
            setHighlightedId(place?.id);
            if (place) modules?.searchResults.setEventState({ id: place.id, state: 'hover' });
            else modules?.searchResults.clearEventStates({ states: ['hover'] });
        },
    };
};

export type PlaceSearch = ReturnType<typeof usePlaceSearch>;
