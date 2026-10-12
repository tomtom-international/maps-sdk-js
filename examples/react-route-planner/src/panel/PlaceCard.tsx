import type { Place } from '@tomtom-org/maps-sdk/core';
import { placeSubtitle, placeTitle } from '../format';
import './PlaceCard.css';

type PlaceCardProps = {
    place: Place;
    onAdd: () => void;
    onStart: () => void;
    onEnd: () => void;
};

/** The popup for a place not on the route yet: three ways to put it there. */
export const PlaceCard = ({ place, onAdd, onStart, onEnd }: PlaceCardProps) => {
    const subtitle = placeSubtitle(place);
    return (
        <div className="ui-place-card">
            <span className="ui-place-card-title">{placeTitle(place)}</span>
            {subtitle && <span className="ui-place-card-subtitle">{subtitle}</span>}
            <button type="button" className="ui-button ui-button-sm ui-button-full" onClick={onAdd}>
                Add to the route
            </button>
            <div className="ui-button-group-horizontal">
                <button type="button" className="ui-button ui-button-outline ui-button-xs" onClick={onStart}>
                    Start here
                </button>
                <button type="button" className="ui-button ui-button-outline ui-button-xs" onClick={onEnd}>
                    End here
                </button>
            </div>
        </div>
    );
};

type StopCardProps = { place: Place; label: string; onRemove: () => void };

/** The popup for a stop's pin. */
export const StopCard = ({ place, label, onRemove }: StopCardProps) => (
    <div className="ui-place-card">
        <span className="ui-place-card-label">{label}</span>
        <span className="ui-place-card-title">{placeTitle(place)}</span>
        <button type="button" className="ui-button ui-button-outline ui-button-sm ui-button-full" onClick={onRemove}>
            Remove from the route
        </button>
    </div>
);
