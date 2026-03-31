import type { TomTomMap, TrafficAreaAnalyticsModule } from '@tomtom-org/maps-sdk/map';
import { Popup } from 'maplibre-gl';

export function initTooltip(map: TomTomMap, analyticsModule: TrafficAreaAnalyticsModule): void {
    const popup = new Popup({
        closeButton: false,
        closeOnClick: true,
        anchor: 'left',
        offset: 12,
        maxWidth: '220px',
        className: 'sdk-example-maplibre-popup aa-tile-popup',
    });

    analyticsModule.events.on('hover', (feature, lngLat) => {
        const properties = feature.properties;
        popup
            .setLngLat(lngLat)
            .setHTML(`
                <div class="aa-tooltip-row"><span class="aa-tooltip-label">Congestion</span><span class="aa-tooltip-value">${properties.congestionLevel ?? 0}%</span></div>
                <div class="aa-tooltip-row"><span class="aa-tooltip-label">Speed</span><span class="aa-tooltip-value">${properties.speed ?? 0} km/h</span></div>
                <div class="aa-tooltip-row"><span class="aa-tooltip-label">Free Flow</span><span class="aa-tooltip-value">${properties.freeFlowSpeed ?? 0} km/h</span></div>
                <div class="aa-tooltip-row"><span class="aa-tooltip-label">Travel Time</span><span class="aa-tooltip-value">${properties.travelTime ?? 0} min/10km</span></div>
            `)
            .addTo(map.mapLibreMap);
    });

    // Hide tooltip when mouse leaves the map
    map.mapLibreMap.getCanvas().addEventListener('mouseleave', () => {
        popup.remove();
    });
}
