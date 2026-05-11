import { Popup } from 'maplibre-gl';

export const createStopPopup = (): Popup =>
    new Popup({ closeButton: false, anchor: 'bottom', className: 'sdk-example-maplibre-popup stop-action-popup' });

export const buildAddStopHTML = (): string => `<button class="sdk-example-button stop-popup-btn">Add stop</button>`;

export const buildRemoveStopHTML = (): string =>
    `<button class="sdk-example-button sdk-example-button-secondary stop-popup-btn">Remove stop</button>`;
