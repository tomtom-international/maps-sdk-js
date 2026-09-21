import type { Place, SearchPlaceProps } from '@tomtom-org/maps-sdk/core';
import { Popup } from 'maplibre-gl';

const formatTime = (hour: number, minute: number) =>
    `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;

const buildOpeningHoursHtml = (place: Place<SearchPlaceProps>): string => {
    const openingHours = place.properties.poi?.openingHours;
    if (!openingHours) return '';

    if (openingHours.alwaysOpenThisPeriod) {
        return '<p class="ui-popup-hours ui-popup-hours--open">Open 24/7</p>';
    }

    const now = new Date();
    const isOpenNow = openingHours.timeRanges.some(({ start, end }) => now >= start.date && now <= end.date);
    const todayStr = now.toISOString().split('T')[0];
    const todayRanges = openingHours.timeRanges.filter(({ start }) => start.dateYYYYMMDD === todayStr);
    const hoursText = todayRanges
        .map(({ start, end }) => `${formatTime(start.hour, start.minute)}–${formatTime(end.hour, end.minute)}`)
        .join(', ');

    const statusClass = isOpenNow ? 'ui-popup-hours--open' : 'ui-popup-hours--closed';
    const statusText = isOpenNow ? 'Open now' : 'Closed now';
    const hoursSuffix = hoursText ? ` · ${hoursText}` : '';

    return `<p class="ui-popup-hours ${statusClass}">${statusText}${hoursSuffix}</p>`;
};

export const buildPopupHtml = (place: Place<SearchPlaceProps>): string => {
    const poi = place.properties.poi;
    const address = place.properties.address;
    const category = poi?.localizedCategories?.[0];

    return `
        <div class="ui-popup">
            <p class="ui-popup-name">${poi?.name}</p>
            ${category ? `<p class="ui-popup-category">${category}</p>` : ''}
            ${buildOpeningHoursHtml(place)}
            ${address?.freeformAddress ? `<p class="ui-popup-address">${address.freeformAddress}</p>` : ''}
            ${poi?.url ? `<a class="ui-popup-url" href="${poi.url}" target="_blank" rel="noopener">${poi.url.replace(/^https?:\/\/(www\.)?/, '')}</a>` : ''}
            ${poi?.phone ? `<p class="ui-popup-phone">${poi.phone}</p>` : ''}
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
        className: 'ui-maplibre-popup ui-poi-popup',
    });
