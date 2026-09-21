import { formatDuration } from '@tomtom-org/maps-sdk/core';
import type { TrafficIncidentsModuleFeature } from '@tomtom-org/maps-sdk/map';
import { Popup } from 'maplibre-gl';

const row = (label: string, value: string, className?: string) => `
    <div class="ui-incident-row">
        <span class="ui-form-label">${label}</span>
        <span class="ui-incident-value${className ? ` ${className}` : ''}">${value}</span>
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
        <div class="ui-incident-popup">
            ${row('Category', category)}
            ${description ? row('Description', description) : ''}
            ${row('Severity', magnitudeOfDelay, `ui-severity-${magnitudeOfDelay}`)}
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
    new Popup({ closeButton: false, className: 'ui-maplibre-popup ui-incident-popup-wrapper' });
