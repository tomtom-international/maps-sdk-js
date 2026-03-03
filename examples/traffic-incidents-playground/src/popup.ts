import { formatDuration } from '@tomtom-org/maps-sdk/core';
import type { TrafficIncidentsModuleFeature } from '@tomtom-org/maps-sdk/map';
import { Popup } from 'maplibre-gl';

const formatLabel = (value: string) => value.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

const row = (label: string, value: string, className?: string) => `
    <div class="sdk-example-incident-row">
        <span class="sdk-example-form-label">${label}</span>
        <span class="sdk-example-incident-value${className ? ` ${className}` : ''}">${value}</span>
    </div>`;

const formatDate = (date: Date) => date.toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' });

export const buildPopupHTML = ({ properties }: TrafficIncidentsModuleFeature): string => {
    const {
        description,
        category,
        magnitudeOfDelay,
        roadCategory,
        delayInSeconds,
        partOfTwoWayRoad,
        startTime,
        endTime,
        probabilityOfOccurrence,
        numberOfReports,
        lastReportTime,
        averageSpeedKmph,
    } = properties;
    const delay = formatDuration(delayInSeconds);

    return `
        <div class="sdk-example-incident-popup">
            ${row('Category', category)}
            ${description ? row('Description', description) : ''}
            ${row('Severity', magnitudeOfDelay, `sdk-example-severity-${magnitudeOfDelay}`)}
            ${delay ? row('Delay', delay) : ''}
            ${row('Road', roadCategory)}
            ${probabilityOfOccurrence ? row('Probability', probabilityOfOccurrence) : ''}
            ${averageSpeedKmph ? row('Avg Speed', `${averageSpeedKmph} km/h`) : ''}
            ${numberOfReports ? row('Reports', String(numberOfReports)) : ''}
            ${lastReportTime ? row('Last Report', formatDate(lastReportTime)) : ''}
            ${partOfTwoWayRoad ? row('Two-way Road', 'Yes') : ''}
            ${startTime ? row('Start', formatDate(startTime)) : ''}
            ${endTime ? row('End', formatDate(endTime)) : ''}
        </div>`;
};

export const createIncidentPopup = () =>
    new Popup({ closeButton: false, className: 'sdk-example-maplibre-popup sdk-example-incident-popup-wrapper' });
