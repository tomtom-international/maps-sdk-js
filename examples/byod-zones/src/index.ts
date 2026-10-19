import { bboxFromGeoJSON, TomTomConfig } from '@tomtom-org/maps-sdk/core';
import { BaseMapModule, GeometriesModule, TomTomMap } from '@tomtom-org/maps-sdk/map';
import './style.css';
import { API_KEY } from './config';
import { zones } from './zones';

// (Set your own API key when working in your own environment)
TomTomConfig.instance.put({ apiKey: API_KEY, language: 'en-GB' });

const panel = document.getElementById('zone-panel') as HTMLElement;
const euros = new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'EUR' });

const map = new TomTomMap({
    mapLibre: { container: 'sdk-map', bounds: bboxFromGeoJSON(zones), fitBoundsOptions: { padding: 40 } },
});

(async () => {
    const zonesModule = await GeometriesModule.create(map, {
        fill: { palette: ['#e63312', '#0a7cbf', '#f5a000', '#00a65e', '#8a3ffc'], opacity: 0.25 },
        line: { width: 2 },
        label: { title: ['get', 'name'] },
    });
    await zonesModule.show(zones);

    const baseMap = await BaseMapModule.get(map, { events: { cursorOnHover: 'default' } });

    zonesModule.events.on('click', (zone) => {
        const { name, deliveryFee, deliveryMinutes } = zone.properties;
        panel.innerHTML = `<h3 class="ui-subheading">${name}</h3>
            <dl class="ui-detail-list">
                <div><dt>Delivery fee</dt><dd>${euros.format(deliveryFee)}</dd></div>
                <div><dt>Delivery time</dt><dd>${deliveryMinutes} min</dd></div>
            </dl>`;
        panel.hidden = false;
    });

    baseMap.events.on('click', () => {
        zonesModule.clearEventStates({ states: ['click'] });
        panel.hidden = true;
    });
})();
