import type { TomTomMap, TrafficAreaAnalyticsModule } from '@tomtom-org/maps-sdk/map';
import { Popup } from 'maplibre-gl';

export const initTooltip = (map: TomTomMap, analyticsModule: TrafficAreaAnalyticsModule): void => {
    const popup = new Popup({
        closeButton: false,
        closeOnClick: false,
        anchor: 'left',
        offset: 20,
        maxWidth: '220px',
        className: 'sdk-example-maplibre-popup aa-tile-popup',
    });

    const buildHTML = (properties: Record<string, unknown>) => `
        <div class="aa-tooltip-row"><span class="aa-tooltip-label">Congestion</span><span class="aa-tooltip-value">${properties.congestionLevel ?? 0}%</span></div>
        <div class="aa-tooltip-row"><span class="aa-tooltip-label">Speed</span><span class="aa-tooltip-value">${properties.speed ?? 0} km/h</span></div>
        <div class="aa-tooltip-row"><span class="aa-tooltip-label">Free Flow</span><span class="aa-tooltip-value">${properties.freeFlowSpeed ?? 0} km/h</span></div>
        <div class="aa-tooltip-row"><span class="aa-tooltip-label">Travel Time</span><span class="aa-tooltip-value">${properties.travelTime ?? 0} min/10km</span></div>
    `;

    analyticsModule.events.on('hover', (feature, lngLat) => {
        popup.setLngLat(lngLat).setHTML(buildHTML(feature.properties)).addTo(map.mapLibreMap);
    });

    // Hide tooltip when mouse leaves the map (only if not pinned)
    map.mapLibreMap.getCanvas().addEventListener('mouseleave', () => {
        popup.remove();
    });
};
