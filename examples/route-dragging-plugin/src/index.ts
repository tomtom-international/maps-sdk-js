import { formatDistance, formatDuration, TomTomConfig } from '@tomtom-org/maps-sdk/core';
import { RoutingModule, TomTomMap } from '@tomtom-org/maps-sdk/map';
import { RouteDragging } from '@tomtom-org/maps-sdk-plugin-route-dragging';
import './style.css';
import { API_KEY } from './config';

// (Set your own API key when working in your own environment)
TomTomConfig.instance.put({ apiKey: API_KEY, language: 'en-GB' });

const map = new TomTomMap({
    mapLibre: {
        container: 'sdk-map',
        center: [4.85, 52.15],
        zoom: 9,
    },
});

(async () => {
    const routing = await RoutingModule.create(map);
    const summary = document.querySelector<HTMLElement>('#route-summary');

    const dragging = new RouteDragging(routing, {
        onRoutes: (routes) => {
            const route = routes.features[0];
            if (!summary || !route) return;

            const { lengthInMeters, travelTimeInSeconds } = route.properties.summary;
            summary.textContent = `${formatDistance(lengthInMeters)}, ${formatDuration(travelTimeInSeconds)}`;
        },
    });

    await dragging.setWaypoints([
        [4.8897, 52.3731], // Amsterdam
        [5.1214, 52.0907], // Utrecht
        [4.4777, 51.9244], // Rotterdam
    ]);
})();
