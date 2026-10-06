import { formatDuration, type TrafficIncident } from '@tomtom-org/maps-sdk/core';
import { Popup } from 'maplibre-gl';

const row = (label: string, value: string, className?: string) => `
    <div class="ui-incident-row">
        <span class="ui-form-label">${label}</span>
        <span class="ui-incident-value${className ? ` ${className}` : ''}">${value}</span>
    </div>`;

export const buildPopupHTML = (incident: TrafficIncident): string => {
    const { category, magnitudeOfDelay, delayInSeconds, roadNumbers, events } = incident.properties;
    const description = events?.[0]?.description ?? category;
    const delay = delayInSeconds ? formatDuration(delayInSeconds) : null;
    const road = roadNumbers?.length ? roadNumbers.join(', ') : null;
    return `
        <div class="ui-incident-popup">
            ${row('Category', category)}
            ${row('Severity', magnitudeOfDelay, `ui-severity-${magnitudeOfDelay}`)}
            ${delay ? row('Delay', delay) : ''}
            ${road ? row('Road', road) : ''}
            ${row('Description', description)}
        </div>`;
};

export const createIncidentPopup = () => new Popup({ closeButton: false, className: 'ui-incident-popup-wrapper' });
