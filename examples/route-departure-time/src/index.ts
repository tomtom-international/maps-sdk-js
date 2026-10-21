import { formatDuration, type Routes, TomTomConfig } from '@tomtom-org/maps-sdk/core';
import { RoutingModule, TomTomMap } from '@tomtom-org/maps-sdk/map';
import { calculateRoute, type LocalDateTime } from '@tomtom-org/maps-sdk/services';
import { API_KEY } from './config';
import './style.css';
import { initTogglePanel } from './togglePanel';

// (Set your own API key when working in your own environment)
TomTomConfig.instance.put({ apiKey: API_KEY, language: 'en-GB' });

const TIME_ZONE = 'Europe/Amsterdam';
const DEPARTURE_HOURS = [6, 8, 10, 12, 14, 16, 18, 20];

// Haarlem station to Amsterdam Zuid station.
const locations: [number, number][] = [
    [4.6363, 52.3873],
    [4.8722, 52.3389],
];

const dayText = document.querySelector<HTMLElement>('#ui-day');
const departureList = document.querySelector<HTMLElement>('#ui-departures');

// The next Monday to Friday after today in Amsterdam, as YYYY-MM-DD.
const nextWeekday = (): string => {
    const day = new Date(`${new Date().toLocaleDateString('en-CA', { timeZone: TIME_ZONE })}T12:00:00Z`);
    do day.setUTCDate(day.getUTCDate() + 1);
    while (day.getUTCDay() === 0 || day.getUTCDay() === 6);
    return day.toISOString().slice(0, 10);
};

const clockTime = (date: Date) => date.toLocaleTimeString('en-GB', { timeZone: TIME_ZONE, timeStyle: 'short' });

const span = (className: string, textContent = '') =>
    Object.assign(document.createElement('span'), { className, textContent });

(async () => {
    initTogglePanel();

    const map = new TomTomMap({
        mapLibre: { container: 'sdk-map', center: [4.79, 52.365], zoom: 10.8 },
    });
    const routingModule = await RoutingModule.create(map);
    await routingModule.showWaypoints(locations);

    const day = nextWeekday();
    // Wall-clock times without an offset, which the routing API reads in the origin's time zone.
    const departures = DEPARTURE_HOURS.map((hour) => `${day}T${String(hour).padStart(2, '0')}:00:00` as LocalDateTime);
    dayText?.replaceChildren(
        new Date(`${day}T12:00:00Z`).toLocaleDateString('en-GB', { timeZone: TIME_ZONE, dateStyle: 'full' }),
    );

    const plans: Routes[] = await Promise.all(
        departures.map((localDateTime) => calculateRoute({ locations, when: { option: 'departAt', localDateTime } })),
    );
    const durations = plans.map((routes) => routes.features[0].properties.summary.travelTimeInSeconds);
    const fastestIndex = durations.indexOf(Math.min(...durations));
    const longest = Math.max(...durations);

    plans.forEach((routes, index) => {
        const radio = Object.assign(document.createElement('input'), { type: 'radio', name: 'departure' });
        radio.checked = index === fastestIndex;
        radio.addEventListener('change', () => routingModule.showRoutes(routes));

        const bar = span('ui-departure-bar');
        bar.style.width = `${(durations[index] / longest) * 100}%`;
        const track = span('ui-departure-track');
        track.append(bar);

        const row = Object.assign(document.createElement('label'), { className: 'ui-departure' });
        row.classList.toggle('ui-departure-fastest', index === fastestIndex);
        row.append(
            radio,
            span('ui-departure-time', clockTime(routes.features[0].properties.summary.departureTime)),
            track,
            span('ui-departure-duration', formatDuration(durations[index])),
        );
        departureList?.append(row);
    });

    await routingModule.showRoutes(plans[fastestIndex]);
})();
