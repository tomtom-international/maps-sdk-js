import type { TrafficFlowModuleFeature } from '@tomtom-org/maps-sdk/map';
import { Popup } from 'maplibre-gl';

const formatLabel = (value: string) => value.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

const row = (label: string, value: string) => `
    <div class="sdk-example-flow-row">
        <span class="sdk-example-form-label">${label}</span>
        <span class="sdk-example-flow-value">${value}</span>
    </div>`;

const formatPercent = (value: number) => `${Math.round(value * 100)}%`;

export const buildPopupHTML = ({ properties }: TrafficFlowModuleFeature): string => {
    const {
        roadCategory,
        roadSubcategory,
        relativeSpeed,
        leftHandTraffic,
        roadClosure,
        absoluteSpeed,
        partOfTwoWayRoad,
    } = properties;

    return `
        <div class="sdk-example-flow-popup">
            ${row('Road Category', formatLabel(roadCategory))}
            ${roadSubcategory ? row('Subcategory', formatLabel(roadSubcategory)) : ''}
            ${roadClosure ? row('Road Closure', 'Yes') : ''}
            ${row('Relative Speed', formatPercent(relativeSpeed))}
            ${absoluteSpeed ? row('Absolute Speed', `${absoluteSpeed} km/h`) : ''}
            ${leftHandTraffic ? row('Left-hand Traffic', 'Yes') : ''}
            ${partOfTwoWayRoad ? row('Two-way Road', 'Yes') : ''}
        </div>`;
};

export const createFlowPopup = () => new Popup({ closeButton: false, className: 'sdk-example-flow-popup-wrapper' });
