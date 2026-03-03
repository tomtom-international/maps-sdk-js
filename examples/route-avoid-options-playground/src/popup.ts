import { Popup } from 'maplibre-gl';

export const createSectionPopup = (): Popup =>
    new Popup({ closeButton: false, anchor: 'bottom', className: 'avoid-section-popup' });

export const buildAvoidHTML = (): string => `<button class="sdk-example-button avoid-popup-btn">Avoid</button>`;
