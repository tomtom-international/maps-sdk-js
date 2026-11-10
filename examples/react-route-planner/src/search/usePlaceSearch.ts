import { skipToken, useInfiniteQuery } from '@tanstack/react-query';
import type { PathLike, Place, Route } from '@tomtom-org/maps-sdk/core';
import { type DiscoverPlacesResponse, discoverPlaces } from '@tomtom-org/maps-sdk/services';
import { useEffect, useMemo, useRef, useState } from 'react';
import { placeTitle } from '../format';
import { flyBetweenPanels } from '../map/coveringPanels';
import type { MapModules } from '../map/useMapModules';
import {
    requestFilters,
    type SearchRequest,
    type SearchScope,
    type SectionStretch,
    type StationFilters,
} from './searchRequest';

const RESULTS_PER_PAGE = 20;

type SearchPageParameters = {
    modules: MapModules;
    request: SearchRequest;
    stationFilters: StationFilters;
    /** Set for an along-route search, with the longest detour it allows. `route` may be one section. */
    alongRoute?: { route: PathLike; maxDetourMinutes: number };
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

type SectionPin = { route?: Route; sectionId?: string; coordinates?: Route['geometry']['coordinates'] };

/**
 * The scope the chip, the header and a fetch share. A recalculated route keeps the previous
 * section's polyline, so a later detour or filter searches that stretch again.
 */
const sectionQuery = (
    scope: SearchScope,
    sectionStretch: SectionStretch | undefined,
    route: Route | undefined,
    pin: { current: SectionPin },
): {
    effectiveScope: SearchScope;
    sectionId?: string;
    holding: boolean;
    sectionGeometry?: Route['geometry']['coordinates'];
} => {
    const holding =
        scope === 'section' &&
        sectionStretch === undefined &&
        pin.current.route !== undefined &&
        pin.current.route !== route;
    if (sectionStretch && route)
        pin.current = { route, sectionId: sectionStretch.id, coordinates: sectionStretch.coordinates };
    const effectiveScope: SearchScope = scope === 'section' && !sectionStretch && !holding ? 'route' : scope;
    const sectionId =
        scope === 'section' ? (sectionStretch?.id ?? (holding ? pin.current.sectionId : undefined)) : undefined;
    const sectionGeometry =
        scope === 'section'
            ? (sectionStretch?.coordinates ?? (holding ? pin.current.coordinates : undefined))
            : undefined;
    return { effectiveScope, sectionId, holding, sectionGeometry };
};

const placesQueryFn =
    (
        modules: MapModules,
        request: SearchRequest,
        stationFilters: StationFilters,
        alongRoute: boolean,
        maxDetourMinutes: number,
        geometry: PathLike | undefined,
    ) =>
    ({ pageParam, signal }: { pageParam?: string; signal: AbortSignal }) =>
        searchPage({
            modules,
            request,
            stationFilters,
            alongRoute: alongRoute && geometry ? { route: geometry, maxDetourMinutes } : undefined,
            cursor: pageParam,
            signal,
        });

/** Runs the current request in its scope, a page at a time. */
export const usePlaceSearch = (
    modules: MapModules | undefined,
    route: Route | undefined,
    routePlaceIds: string[],
    sectionStretch: SectionStretch | undefined,
) => {
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
    const alongRoute = scope !== 'map' && route !== undefined;
    const sectionPin = useRef<SectionPin>({});
    const { effectiveScope, sectionId, holding, sectionGeometry } = sectionQuery(
        scope,
        sectionStretch,
        route,
        sectionPin,
    );

    const query = useInfiniteQuery({
        queryKey: ['places', request, searchRun, stationFilters, alongRoute && maxDetourMinutes, sectionId],
        queryFn:
            modules && request
                ? placesQueryFn(
                      modules,
                      request,
                      stationFilters,
                      alongRoute,
                      maxDetourMinutes,
                      effectiveScope === 'section' ? sectionGeometry : routeRef.current,
                  )
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
            if (holding) setScope('route');
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
        effectiveScope,
        setScope,
        sectionStretch,
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
