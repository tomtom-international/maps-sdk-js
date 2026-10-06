import { Popup } from 'maplibre-gl';

export const createSectionPopup = (): Popup =>
    new Popup({ closeButton: false, anchor: 'bottom', className: 'ui-maplibre-popup avoid-section-popup' });

export const buildAvoidHTML = (): string => `<button class="ui-button avoid-popup-btn">Avoid</button>`;
