import { keepPreviousData, skipToken, useMutation, useQuery } from '@tanstack/react-query';
import type { Place } from '@tomtom-org/maps-sdk/core';
import type { TomTomMap } from '@tomtom-org/maps-sdk/map';
import { getSearchSuggestions, type PlaceSuggestion, type SearchSuggestion } from '@tomtom-org/maps-sdk/services';
import { useCombobox } from 'downshift';
import { type LucideIcon, MapPin, Plus, Search, Signpost, Store, Tag } from 'lucide-react';
import { useState } from 'react';
import { useDebounce } from 'use-debounce';
import { Hint } from '../panel/fields';
import { refinementRequest, type SearchRequest } from './searchRequest';
import './suggestion.css';
import './SearchBox.css';

type SearchBoxProps = {
    map?: TomTomMap;
    placeholder: string;
    /** A free-text search, or a brand or category suggestion, to run in the current scope. */
    onSearch: (request: SearchRequest) => void;
    onPreview: (place: Place) => void;
    onAdd: (place: Place) => void;
};

/** The list's first row runs the text as typed; the rest are the service's suggestions. */
type Option = { kind: 'text' } | SearchSuggestion;

const SUGGEST_DELAY_MS = 200;

const isRefinement = (option: SearchSuggestion) => option.kind === 'brand' || option.kind === 'category';

/** The service's suggestions for the text once typing pauses, biased to the middle of the map. */
const useSuggestions = (map: TomTomMap | undefined, text: string) => {
    const [settledText] = useDebounce(text, SUGGEST_DELAY_MS);
    const query = useQuery({
        queryKey: ['suggestions', settledText],
        queryFn:
            map && settledText.length >= 2
                ? ({ signal }) =>
                      getSearchSuggestions({
                          query: settledText,
                          geoBias: { position: map.mapLibreMap.getCenter().toArray() },
                          limit: 8,
                          signal,
                      })
                : skipToken,
        placeholderData: keepPreviousData,
    });
    return { suggestions: (text.length >= 2 && query.data?.suggestions) || [], error: query.error };
};

export const SearchBox = ({ map, placeholder, onSearch, onPreview, onAdd }: SearchBoxProps) => {
    const [query, setQuery] = useState('');
    const text = query.trim();
    const { suggestions, error: suggestionsError } = useSuggestions(map, text);
    // A place suggestion carries no position until resolved.
    const resolving = useMutation({ mutationFn: (suggestion: PlaceSuggestion) => suggestion.resolve() });
    const resolve = (suggestion: PlaceSuggestion, then: (place: Place) => void) =>
        resolving.mutate(suggestion, {
            onSuccess: (place) => {
                then(place);
                setQuery('');
            },
        });
    const error = (resolving.error ?? suggestionsError)?.message;

    const pick = (option: Option) => {
        if (option.kind === 'text') {
            onSearch({ title: `“${text}”`, query: text });
        } else if (isRefinement(option)) {
            onSearch(refinementRequest(option));
        } else {
            void resolve(option, onPreview);
            return;
        }
        setQuery('');
    };

    const options: Option[] = text.length >= 2 ? [{ kind: 'text' }, ...suggestions] : [];
    const { isOpen, highlightedIndex, getInputProps, getMenuProps, getItemProps } = useCombobox<Option>({
        items: options,
        inputValue: query,
        selectedItem: null,
        defaultHighlightedIndex: 0,
        itemToString: () => query,
        onInputValueChange: ({ inputValue }) => setQuery(inputValue),
        onSelectedItemChange: ({ selectedItem }) => selectedItem && pick(selectedItem),
        // Leaving the field closes the list without running the highlighted row.
        stateReducer: (state, { type, changes }) =>
            type === useCombobox.stateChangeTypes.InputBlur
                ? { ...changes, selectedItem: state.selectedItem }
                : changes,
    });

    return (
        <div className="ui-search-field">
            <div className="ui-search-row">
                <input
                    className="ui-input"
                    type="search"
                    placeholder={placeholder}
                    {...getInputProps({ 'aria-label': 'Search places, addresses, brands and categories' })}
                />
                <button
                    type="button"
                    className="ui-button ui-button-icon"
                    aria-label="Search"
                    disabled={!text}
                    onClick={() => pick({ kind: 'text' })}
                >
                    <Search />
                </button>
            </div>
            {error && <p className="ui-form-error">{error}</p>}
            <ul className={isOpen && options.length ? 'ui-result-list' : undefined} {...getMenuProps()}>
                {isOpen &&
                    options.map((option, index) => (
                        <li
                            key={
                                option.kind === 'text'
                                    ? 'text'
                                    : `${option.kind}-${option.title}-${'id' in option ? option.id : ''}`
                            }
                            className={`ui-result-item ui-suggestion${highlightedIndex === index ? ' ui-hovered' : ''}`}
                            {...getItemProps({ item: option, index })}
                        >
                            {option.kind === 'text' ? (
                                <>
                                    <Search className="ui-icon ui-suggestion-icon" />
                                    <span className="ui-suggestion-main">
                                        <span className="ui-suggestion-title">Search for “{text}”</span>
                                    </span>
                                </>
                            ) : (
                                <SuggestionContent
                                    suggestion={option}
                                    onAdd={isRefinement(option) ? undefined : () => resolve(option, onAdd)}
                                />
                            )}
                        </li>
                    ))}
            </ul>
        </div>
    );
};

const kinds: Record<SearchSuggestion['kind'], { icon: LucideIcon; refines?: string }> = {
    place: { icon: MapPin },
    address: { icon: MapPin },
    street: { icon: Signpost },
    area: { icon: MapPin },
    brand: { icon: Store, refines: 'Brand · show its locations' },
    category: { icon: Tag, refines: 'Category · show places' },
};

type SuggestionContentProps = { suggestion: SearchSuggestion; onAdd?: () => void };

const SuggestionContent = ({ suggestion, onAdd }: SuggestionContentProps) => {
    const { icon: KindIcon, refines } = kinds[suggestion.kind];
    return (
        <>
            <KindIcon className="ui-icon ui-suggestion-icon" />
            <span className="ui-suggestion-main">
                <span className="ui-suggestion-title">{suggestion.title}</span>
                <span className="ui-suggestion-subtitle">
                    {'subtitles' in suggestion && suggestion.subtitles.length
                        ? suggestion.subtitles.join(', ')
                        : refines}
                </span>
            </span>
            {onAdd && (
                <Hint label="Add to the route">
                    <button
                        type="button"
                        className="ui-button ui-button-secondary ui-button-icon ui-button-xs"
                        aria-label={`Add ${suggestion.title} to the route`}
                        onClick={(event) => {
                            // The row itself previews the place; this button adds it instead.
                            event.stopPropagation();
                            onAdd();
                        }}
                    >
                        <Plus />
                    </button>
                </Hint>
            )}
        </>
    );
};
