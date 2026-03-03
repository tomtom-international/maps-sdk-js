import { formatDistance, formatDuration } from '@tomtom-org/maps-sdk/core';
import { Popup } from 'maplibre-gl';

const BASE_POPUP_OPTIONS = {
    closeButton: false,
    closeOnClick: false,
    focusAfterOpen: false,
    anchor: 'bottom' as const,
};

export const createHoverPopup = (): Popup =>
    new Popup({ ...BASE_POPUP_OPTIONS, className: 'sdk-example-maplibre-popup progress-popup' });

export const createPinnedPopup = (): Popup =>
    new Popup({ ...BASE_POPUP_OPTIONS, className: 'sdk-example-maplibre-popup progress-popup progress-popup--pinned' });

const formatClockTime = (departureTime: Date, travelTimeInSeconds: number): string => {
    const clockTime = new Date(departureTime.getTime() + travelTimeInSeconds * 1000);
    return clockTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export const buildPopupHTML = (
    distanceInMeters: number,
    travelTimeInSeconds: number,
    departureTime: Date | undefined,
    pinned: boolean,
): string => {
    const clockTimeRow =
        departureTime !== undefined
            ? `<div class="progress-popup-row progress-popup-row--sub">
                   ${formatClockTime(departureTime, travelTimeInSeconds)}
               </div>`
            : '';

    const closeButton = pinned
        ? `<button class="progress-popup-close" aria-label="Close">&#x2715;</button>`
        : `<span class="progress-popup-close" aria-hidden="true"></span>`;

    return `
        <div class="progress-popup-row">
            <span>${formatDuration(travelTimeInSeconds) ?? '—'}</span>
            <span class="progress-popup-row--right">${formatDistance(distanceInMeters)}</span>
            ${closeButton}
        </div>
        ${clockTimeRow}
    `;
};
