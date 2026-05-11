import { formatDuration, type TrafficIncident } from '@tomtom-org/maps-sdk/core';
import { Popup } from 'maplibre-gl';

const row = (label: string, value: string, className?: string) => `
    <div class="sdk-example-incident-row">
        <span class="sdk-example-form-label">${label}</span>
        <span class="sdk-example-incident-value${className ? ` ${className}` : ''}">${value}</span>
    </div>`;

export const buildPopupHTML = (incident: TrafficIncident): string => {
    const { category, magnitudeOfDelay, delayInSeconds, roadNumbers, events } = incident.properties;
    const description = events?.[0]?.description ?? category;
    const delay = delayInSeconds ? formatDuration(delayInSeconds) : null;
    const road = roadNumbers?.length ? roadNumbers.join(', ') : null;
    return `
        <div class="sdk-example-incident-popup">
            ${row('Category', category)}
            ${row('Severity', magnitudeOfDelay, `sdk-example-severity-${magnitudeOfDelay}`)}
            ${delay ? row('Delay', delay) : ''}
            ${road ? row('Road', road) : ''}
            ${row('Description', description)}
        </div>`;
};

export const createIncidentPopup = () =>
    new Popup({ closeButton: false, className: 'sdk-example-incident-popup-wrapper' });
