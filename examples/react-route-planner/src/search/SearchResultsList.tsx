import type { Place } from '@tomtom-org/maps-sdk/core';
import { Plus, X } from 'lucide-react';
import { placeSubtitle, placeTitle } from '../format';
import { Hint } from '../panel/fields';
import type { PlaceSearch } from './usePlaceSearch';
import './suggestion.css';
import './SearchResultsList.css';

type SearchResultsListProps = {
    search: PlaceSearch;
    onOpen: (place: Place) => void;
    onAdd: (place: Place) => void;
};

/** The highest power a charging park offers, which matters more on a road trip than its address. */
const chargingSummary = (place: Place): string | undefined => {
    const connectors = place.properties.chargingPark?.connectors;
    if (!connectors?.length) return undefined;

    const fastest = Math.max(...connectors.map(({ connector }) => connector.ratedPowerKW));
    const points = connectors.reduce((total, { count }) => total + count, 0);
    return `Up to ${fastest} kW · ${points} ${points === 1 ? 'connector' : 'connectors'}`;
};

export const SearchResultsList = ({ search, onOpen, onAdd }: SearchResultsListProps) => {
    const { title, places, searching, error } = search;
    if (!title) return null;

    return (
        <section className="ui-search-results" aria-label="Search results">
            <div className="ui-search-results-header">
                <span className="ui-subheading">
                    {title}
                    {search.alongRoute && search.request && ' along the route'}
                </span>
                <button
                    type="button"
                    className="ui-button ui-button-ghost ui-button-icon ui-button-xs"
                    aria-label="Clear the results"
                    onClick={search.clear}
                >
                    <X />
                </button>
            </div>
            {searching && (
                <p className="ui-status" role="status">
                    <span className="ui-spinner" /> Searching
                </p>
            )}
            {error && <p className="ui-form-error">{error}</p>}
            {places && !places.length && !searching && !error && (
                <p className="ui-note">
                    {search.alongRoute ? 'Nothing found. Try a longer detour.' : 'Nothing found. Try moving the map.'}
                </p>
            )}
            {places && places.length > 0 && (
                <ul className="ui-result-list ui-result-list-inline">
                    {places.map((place) => (
                        <li
                            key={place.id}
                            className={`ui-result-item ui-suggestion${search.highlightedId === place.id ? ' ui-hovered' : ''}`}
                            onMouseEnter={() => search.highlight(place)}
                            onMouseLeave={() => search.highlight(undefined)}
                        >
                            <button type="button" className="ui-suggestion-main" onClick={() => onOpen(place)}>
                                <span className="ui-suggestion-title">{placeTitle(place)}</span>
                                <span className="ui-suggestion-subtitle">
                                    {chargingSummary(place) ?? placeSubtitle(place) ?? place.properties.type}
                                </span>
                            </button>
                            <Hint label="Add to the route">
                                <button
                                    type="button"
                                    className="ui-button ui-button-secondary ui-button-icon ui-button-xs"
                                    aria-label={`Add ${placeTitle(place)} to the route`}
                                    onClick={() => onAdd(place)}
                                >
                                    <Plus />
                                </button>
                            </Hint>
                        </li>
                    ))}
                </ul>
            )}
            {search.loadMore && (
                <button
                    type="button"
                    className="ui-button ui-button-outline ui-button-sm ui-button-full"
                    disabled={searching}
                    onClick={search.loadMore}
                >
                    Load more
                </button>
            )}
        </section>
    );
};
