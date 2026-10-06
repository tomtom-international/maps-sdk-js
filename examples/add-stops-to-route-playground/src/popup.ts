import { Popup } from 'maplibre-gl';

export const createStopPopup = (): Popup =>
    new Popup({ closeButton: false, anchor: 'bottom', className: 'ui-maplibre-popup stop-action-popup' });

export const buildAddStopHTML = (): string => `<button class="ui-button stop-popup-btn">Add stop</button>`;

export const buildRemoveStopHTML = (): string =>
    `<button class="ui-button ui-button-secondary stop-popup-btn">Remove stop</button>`;
