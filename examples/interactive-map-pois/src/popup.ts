import type { Place, SearchPlaceProps } from '@tomtom-org/maps-sdk/core';
import { Popup } from 'maplibre-gl';

const formatTime = (hour: number, minute: number) =>
    `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;

const buildOpeningHoursHtml = (place: Place<SearchPlaceProps>): string => {
    const openingHours = place.properties.poi?.openingHours;
    if (!openingHours) return '';

    if (openingHours.alwaysOpenThisPeriod) {
        return '<p class="sdk-example-popup-hours sdk-example-popup-hours--open">Open 24/7</p>';
    }

    const now = new Date();
    const isOpenNow = openingHours.timeRanges.some(({ start, end }) => now >= start.date && now <= end.date);
    const todayStr = now.toISOString().split('T')[0];
    const todayRanges = openingHours.timeRanges.filter(({ start }) => start.dateYYYYMMDD === todayStr);
    const hoursText = todayRanges
        .map(({ start, end }) => `${formatTime(start.hour, start.minute)}–${formatTime(end.hour, end.minute)}`)
        .join(', ');

    const statusClass = isOpenNow ? 'sdk-example-popup-hours--open' : 'sdk-example-popup-hours--closed';
    const statusText = isOpenNow ? 'Open now' : 'Closed now';

    return `<p class="sdk-example-popup-hours ${statusClass}">${statusText}${hoursText ? ` · ${hoursText}` : ''}</p>`;
};

export const buildPopupHtml = (place: Place<SearchPlaceProps>): string => {
    const poi = place.properties.poi;
    const address = place.properties.address;
    const category = poi?.categories?.[0];

    return `
        <div class="sdk-example-popup">
            <p class="sdk-example-popup-name">${poi?.name}</p>
            ${category ? `<p class="sdk-example-popup-category">${category}</p>` : ''}
            ${buildOpeningHoursHtml(place)}
            ${address?.freeformAddress ? `<p class="sdk-example-popup-address">${address.freeformAddress}</p>` : ''}
            ${poi?.url ? `<a class="sdk-example-popup-url" href="${poi.url}" target="_blank" rel="noopener">${poi.url.replace(/^https?:\/\/(www\.)?/, '')}</a>` : ''}
            ${poi?.phone ? `<p class="sdk-example-popup-phone">${poi.phone}</p>` : ''}
        </div>
    `;
};

export const createPOIPopup = (): Popup =>
    new Popup({
        closeButton: false,
        closeOnClick: false,
        anchor: 'bottom',
        offset: 50,
        maxWidth: '280px',
        className: 'sdk-example-maplibre-popup sdk-example-poi-popup',
    });
