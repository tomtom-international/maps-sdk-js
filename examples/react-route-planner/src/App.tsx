import * as Tabs from '@radix-ui/react-tabs';
import type { Place, Route } from '@tomtom-org/maps-sdk/core';
import { discoverOnePlace } from '@tomtom-org/maps-sdk/services';
import { type LucideIcon, RouteIcon, Search, Signpost, SlidersHorizontal } from 'lucide-react';
import { type Dispatch, useEffect, useState } from 'react';
import { placeTitle } from './format';
import { flyBetweenPanels } from './map/coveringPanels';
import { MapPopup } from './map/MapPopup';
import { useRouteCursorStore } from './map/routeCursor';
import { useMapInteractions } from './map/useMapInteractions';
import { type MapModules, useMapModules } from './map/useMapModules';
import { useRouteHoverProgress } from './map/useRouteHoverProgress';
import { useSectionFocus } from './map/useSectionFocus';
import { defaultLook } from './mapLook/looks';
import { useMapLook } from './mapLook/useMapLook';
import { Directions } from './panel/Directions';
import { CollapseToggle, Hint } from './panel/fields';
import { MapLookControl } from './panel/MapLookPanel';
import { PlaceCard, StopCard } from './panel/PlaceCard';
import { RouteOptionsPanel } from './panel/RouteOptionsPanel';
import { StopList } from './panel/StopList';
import { TripProgress, useTripReplay } from './panel/TripProgress';
import { TripSummary } from './panel/TripSummary';
import { defaultRouteOptions } from './planner/routeOptions';
import {
    addPlaceAction,
    createStop,
    type Stop,
    type StopsAction,
    stopPlaces,
    stopRole,
    useStops,
} from './planner/stops';
import { type RoutePlan, useRoutePlan } from './planner/useRoutePlan';
import { useStopDrag } from './planner/useStopDrag';
import { SearchBox } from './search/SearchBox';
import { SearchOptions } from './search/SearchOptions';
import { SearchResultsList } from './search/SearchResultsList';
import { usePlaceSearch } from './search/usePlaceSearch';
import { RouteSectionsBar } from './sections/RouteSectionsBar';
import './App.css';

const tabs = ['plan', 'search', 'options', 'directions'] as const;

type Tab = (typeof tabs)[number];

const tabLooks: Record<Tab, { label: string; icon: LucideIcon }> = {
    plan: { label: 'Plan', icon: RouteIcon },
    search: { label: 'Search', icon: Search },
    options: { label: 'Options', icon: SlidersHorizontal },
    directions: { label: 'Directions', icon: Signpost },
};

type PopupState = { kind: 'place'; place: Place } | { kind: 'stop'; stopId: string };

/**
 * The trip the planner opens with: from Turin over the Alps into Switzerland, by a fort in the Aosta
 * valley and a lake above Kandersteg. It takes toll motorways, tunnels and the Lötschberg car train.
 */
const SEED_STOPS = [
    { query: 'Torino Porta Nuova' },
    { query: 'Forte di Bard', pauseDurationSeconds: 60 * 60 },
    { query: 'Kandersteg', pauseDurationSeconds: 90 * 60 },
    { query: 'Grindelwald' },
];

const useSeedStops = (dispatch: Dispatch<StopsAction>) => {
    useEffect(() => {
        (async () => {
            const places = await Promise.all(SEED_STOPS.map(({ query }) => discoverOnePlace({ query })));
            if (places.every((place) => place)) {
                dispatch({
                    type: 'seed',
                    stops: places.map((place, index) => createStop(place, SEED_STOPS[index].pauseDurationSeconds)),
                });
            }
        })().catch(() => {
            // Without a seed the planner starts empty, which is still a working planner.
        });
    }, [dispatch]);
};

const roleOf = (stops: Stop[], id?: string): string | undefined => {
    const index = stops.findIndex((stop) => stop.id === id);
    return index === -1 ? undefined : stopRole(index, stops.length);
};

export const App = () => {
    const modules = useMapModules(defaultLook.style);
    const [stops, dispatch] = useStops();
    const [options, setOptions] = useState(defaultRouteOptions);
    const [look, setLook] = useState(defaultLook);
    const [notice, setNotice] = useState<string>();
    const drag = useStopDrag(modules, stops, options, dispatch, setNotice);
    const plan = useRoutePlan(modules, stops, options, drag);
    const route = plan.routes?.features[plan.selectedIndex];
    const search = usePlaceSearch(
        modules,
        route,
        stopPlaces(stops).map((place) => place.id),
    );
    const lookError = useMapLook(modules, look);
    const [tab, setTab] = useState<Tab>('plan');
    const [collapsed, setCollapsed] = useState(false);
    const [targetStopId, setTargetStopId] = useState<string>();
    const [popup, setPopup] = useState<PopupState>();
    const [pointedSectionId, setPointedSectionId] = useState<string>();
    // Section ids are new on every calculation, so a section's details hold for the route they were
    // opened on: a recalculation or another route's pick closes them.
    const [openSection, setOpenSection] = useState<{ route: Route; id: string }>();
    const selectedSectionId = openSection && openSection.route === route ? openSection.id : undefined;
    const selectSection = (id?: string) => setOpenSection(id && route ? { route, id } : undefined);
    const cursorStore = useRouteCursorStore();

    useSeedStops(dispatch);
    useRouteHoverProgress(modules, plan.routes, cursorStore);
    // The section pointed at rings over the route pointed at, which rings over the open section.
    const pointedIds = pointedSectionId ? [pointedSectionId] : plan.pointedSectionIds;
    const openIds = selectedSectionId ? [selectedSectionId] : undefined;
    useSectionFocus(modules, pointedIds ?? openIds);

    const addPlace = (place: Place) => {
        dispatch(addPlaceAction(stops, place, route, targetStopId));
        setTargetStopId(undefined);
        setPopup(undefined);
    };

    const replaceEnd = (place: Place, end: 'start' | 'destination') => {
        const stop = end === 'start' ? stops[0] : stops[stops.length - 1];
        dispatch({ type: 'fill', id: stop.id, place });
        setPopup(undefined);
    };

    useMapInteractions(modules, {
        onPlace: (place) => setPopup({ kind: 'place', place }),
        onStop: (index) => {
            const stop = stops[index];
            if (stop?.place) setPopup({ kind: 'stop', stopId: stop.id });
        },
        onRoute: plan.selectRoute,
        onRouteHover: plan.pointAtRoute,
        onRouteLineHover: plan.pointAtRouteLine,
        onSearchResultHover: (place) => search.setHighlightedId(place?.id),
        onSectionHover: setPointedSectionId,
        onSectionClick: selectSection,
        dismiss: () => {
            if (!selectedSectionId) return false;

            setOpenSection(undefined);
            return true;
        },
        onError: setNotice,
    });

    const target = roleOf(stops, targetStopId);

    return (
        <>
            <div id="sdk-map" />
            <Tabs.Root
                asChild
                value={tab}
                onValueChange={(value) => {
                    const picked = tabs.find((id) => id === value);
                    if (picked) setTab(picked);
                }}
            >
                <aside className="ui-customPanel ui-planner">
                    <div className="ui-panel-header">
                        <PlannerHeading plan={plan} collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
                        <SearchBox
                            map={modules?.map}
                            placeholder={target ? `Search for ${target}` : 'Search places, addresses, brands…'}
                            onSearch={(request) => {
                                search.search(request);
                                setTab('search');
                                setCollapsed(false);
                            }}
                            onPreview={(place) => {
                                search.preview(place);
                                setPopup({ kind: 'place', place });
                            }}
                            onAdd={addPlace}
                        />
                        <PlannerTabs tab={tab} onOpen={() => setCollapsed(false)} />
                    </div>

                    <div className={`ui-panel-content${collapsed ? ' collapsed' : ''}`}>
                        <Notices messages={[notice, lookError]} />
                        <Tabs.Content value="plan">
                            <PlanTab
                                plan={plan}
                                stops={stops}
                                dispatch={dispatch}
                                targetStopId={targetStopId}
                                onTarget={setTargetStopId}
                                onPointAtSection={setPointedSectionId}
                            />
                        </Tabs.Content>
                        <Tabs.Content value="search" className="ui-section">
                            <SearchOptions search={search} />
                            <SearchResultsList
                                search={search}
                                onOpen={(place) => {
                                    flyToPlace(modules, place);
                                    setPopup({ kind: 'place', place });
                                }}
                                onAdd={addPlace}
                            />
                        </Tabs.Content>
                        <Tabs.Content value="options">
                            <RouteOptionsPanel options={options} onChange={setOptions} />
                        </Tabs.Content>
                        <Tabs.Content value="directions">
                            <DirectionsTab modules={modules} route={route} stops={stops} />
                        </Tabs.Content>
                    </div>
                </aside>
            </Tabs.Root>
            {modules && route && (
                <div className="ui-sections-dock">
                    <RouteSectionsBar
                        modules={modules}
                        route={route}
                        stops={stops}
                        cursorStore={cursorStore}
                        pointedSectionId={pointedSectionId}
                        onPointAtSection={setPointedSectionId}
                        selectedSectionId={selectedSectionId}
                        onSelectSection={selectSection}
                    />
                </div>
            )}
            <div className="ui-map-controls">
                <MapLookControl look={look} onChange={setLook} />
            </div>
            {modules && popup && (
                <PlannerPopup
                    modules={modules}
                    popup={popup}
                    stops={stops}
                    onClose={() => setPopup(undefined)}
                    onAdd={addPlace}
                    onReplaceEnd={replaceEnd}
                    onRemove={(id) => {
                        dispatch({ type: 'remove', id });
                        setPopup(undefined);
                    }}
                />
            )}
        </>
    );
};

const Notices = ({ messages }: { messages: (string | undefined)[] }) =>
    messages.map(
        (message) =>
            message && (
                <p key={message} className="ui-form-error ui-notice">
                    {message}
                </p>
            ),
    );

type DirectionsTabProps = { modules?: MapModules; route?: Route; stops: Stop[] };

const DirectionsTab = ({ modules, route, stops }: DirectionsTabProps) =>
    modules && route ? (
        <Trip modules={modules} route={route} stops={stops} />
    ) : (
        <p className="ui-note">Add a start and a destination to get directions.</p>
    );

/** The replay on top, and the directions following it. */
const Trip = ({ modules, route, stops }: Required<DirectionsTabProps>) => {
    const replay = useTripReplay(modules.map, route);
    return (
        <>
            <TripProgress route={route} stopNames={stopPlaces(stops).map(placeTitle)} replay={replay} />
            <Directions map={modules.map} route={route} elapsedSeconds={replay.elapsedSeconds} onJump={replay.jumpTo} />
        </>
    );
};

const flyToPlace = (modules: MapModules | undefined, place: Place) => {
    if (modules) {
        flyBetweenPanels(modules.map, place.geometry.coordinates, Math.max(modules.map.mapLibreMap.getZoom(), 13));
    }
};

type PlannerHeadingProps = { plan: RoutePlan; collapsed: boolean; onToggle: () => void };

const PlannerHeading = ({ plan, collapsed, onToggle }: PlannerHeadingProps) => (
    <h3 className="ui-heading">
        <span className="ui-heading-text">Route planner</span>
        {plan.calculating && (
            <span className="ui-plan-status" role="status">
                <span className="ui-spinner" /> Planning
            </span>
        )}
        <CollapseToggle label="Toggle panel" collapsed={collapsed} onToggle={onToggle} />
    </h3>
);

/** The tabs; picking one, even the open one, unfolds a collapsed panel. */
const PlannerTabs = ({ tab, onOpen }: { tab: Tab; onOpen: () => void }) => (
    <Tabs.List className="ui-button-group-segmented ui-tabs" aria-label="Planner">
        {tabs.map((id) => {
            const { label, icon: Icon } = tabLooks[id];
            const open = tab === id;
            return (
                <Hint key={id} label={label} disabled={open}>
                    <Tabs.Trigger
                        value={id}
                        className={`ui-button ui-toggle ui-button-sm ui-tab${open ? ' active' : ''}`}
                        onClick={onOpen}
                    >
                        <Icon />
                        <span className={open ? undefined : 'ui-sr-only'}>{label}</span>
                    </Tabs.Trigger>
                </Hint>
            );
        })}
    </Tabs.List>
);

type PlanTabProps = {
    plan: RoutePlan;
    stops: Stop[];
    dispatch: Dispatch<StopsAction>;
    targetStopId?: string;
    onTarget: (id?: string) => void;
    onPointAtSection: (sectionId?: string) => void;
};

const PlanTab = ({ plan, stops, dispatch, targetStopId, onTarget, onPointAtSection }: PlanTabProps) => (
    <>
        <StopList stops={stops} dispatch={dispatch} targetStopId={targetStopId} onTarget={onTarget} />
        {plan.error && <p className="ui-form-error">{plan.error}</p>}
        {plan.routes && (
            <TripSummary
                routes={plan.routes}
                selectedIndex={plan.selectedIndex}
                onSelect={plan.selectRoute}
                pointedIndex={plan.pointedIndex}
                onPointAtRoute={plan.pointAtRoute}
                stops={stops}
                onPointAtLeg={onPointAtSection}
            />
        )}
    </>
);

type PlannerPopupProps = {
    modules: MapModules;
    popup: PopupState;
    stops: Stop[];
    onClose: () => void;
    onAdd: (place: Place) => void;
    onReplaceEnd: (place: Place, end: 'start' | 'destination') => void;
    onRemove: (id: string) => void;
};

const PlannerPopup = ({ modules, popup, stops, onClose, onAdd, onReplaceEnd, onRemove }: PlannerPopupProps) => {
    if (popup.kind === 'place') {
        const { place } = popup;
        return (
            <MapPopup map={modules.map} position={place.geometry.coordinates} onClose={onClose}>
                <PlaceCard
                    place={place}
                    onAdd={() => onAdd(place)}
                    onStart={() => onReplaceEnd(place, 'start')}
                    onEnd={() => onReplaceEnd(place, 'destination')}
                />
            </MapPopup>
        );
    }

    const stop = stops.find(({ id }) => id === popup.stopId);
    if (!stop?.place) return null;

    const role = roleOf(stops, stop.id) ?? '';
    return (
        <MapPopup map={modules.map} position={stop.place.geometry.coordinates} onClose={onClose}>
            <StopCard
                place={stop.place}
                label={role.charAt(0).toUpperCase() + role.slice(1)}
                onRemove={() => onRemove(stop.id)}
            />
        </MapPopup>
    );
};
