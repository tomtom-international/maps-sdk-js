import { type DistanceUnitsType, formatDistance, formatDuration, TomTomConfig } from '@tomtom-org/maps-sdk/core';
import { RoutingModule, TomTomMap } from '@tomtom-org/maps-sdk/map';
import { calculateRoute } from '@tomtom-org/maps-sdk/services';
import { API_KEY } from './config';
import './style.css';
import { initTogglePanel } from './togglePanel';

// (Set your own API key when working in your own environment)
TomTomConfig.instance.put({ apiKey: API_KEY, language: 'en-GB' });

const UNIT_CHOICES: { type: DistanceUnitsType; label: string }[] = [
    { type: 'metric', label: 'Metric' },
    { type: 'imperial_uk', label: 'Imperial UK' },
    { type: 'imperial_us', label: 'Imperial US' },
];

// Brighton to Gatwick Airport, through 30 mph streets, the A23 and the M23.
const locations: [number, number][] = [
    [-0.141, 50.8288],
    [-0.1628, 51.1563],
];

const unitsGroup = document.querySelector<HTMLElement>('#ui-units');
const summaryText = document.querySelector<HTMLElement>('#ui-summary');

(async () => {
    initTogglePanel();

    const map = new TomTomMap({
        mapLibre: { container: 'sdk-map', center: [-0.17, 50.99], zoom: 9.6 },
    });
    const routingModule = await RoutingModule.create(map, {
        sections: { speedLimit: { sign: { minZoom: 9 } } },
    });

    // Without `country` sections, the speed limit signs post in the display units rather than each
    // country's own.
    const routes = await calculateRoute({ locations, sectionTypes: ['speedLimit'] });
    await routingModule.showWaypoints(locations);
    const { lengthInMeters, travelTimeInSeconds } = routes.features[0].properties.summary;

    const applyUnits = async (type: DistanceUnitsType) => {
        TomTomConfig.instance.put({ displayUnits: { distance: { type } } });
        // A routing module with no `displayUnits` of its own labels in the global units in force when
        // it draws, so showing the same routes again relabels them.
        await routingModule.showRoutes(routes);
        if (summaryText)
            summaryText.textContent = `${formatDistance(lengthInMeters)}, ${formatDuration(travelTimeInSeconds)}`;
    };

    for (const { type, label } of UNIT_CHOICES) {
        const radio = Object.assign(document.createElement('input'), { type: 'radio', name: 'units', value: type });
        radio.checked = type === 'metric';
        radio.addEventListener('change', () => applyUnits(type));
        const row = Object.assign(document.createElement('label'), { className: 'ui-radio-label' });
        row.append(radio, label);
        unitsGroup?.append(row);
    }

    await applyUnits('metric');
})();
