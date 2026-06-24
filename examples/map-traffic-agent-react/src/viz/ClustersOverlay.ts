import { type Map as MapLibreMap, Marker } from 'maplibre-gl';
import './clusterPins.css';
import type { Cluster } from '../agent/types';
import { formatDelay } from '../utils/format';

const TREND_ICONS: Record<string, string> = {
    growing: '↑',
    fading: '↓',
    steady: '→',
    new: '★',
    unknown: '',
};

export type ClustersOverlayOptions = {
    onClick?: (cluster: Cluster) => void;
};

export class ClustersOverlay {
    private markers: Marker[] = [];
    private removed = false;

    constructor(
        private readonly map: MapLibreMap,
        private readonly options: ClustersOverlayOptions = {},
    ) {}

    setClusters(clusters: readonly Cluster[]): void {
        if (this.removed) return;
        for (const m of this.markers) m.remove();
        this.markers = [];

        clusters.forEach((c, idx) => {
            // Skip only a null-island centroid (0,0); a real lng of 0 (London/Spain) is valid.
            if (!c.centroid || (c.centroid[0] === 0 && c.centroid[1] === 0)) return;
            const el = document.createElement('button');
            el.type = 'button';
            el.className = 'cluster-pin';
            el.dataset.trend = c.trend ?? 'unknown';
            el.title = `${c.headline} — ${c.incidentIds.length} incidents`;
            el.setAttribute('aria-label', `Cluster ${idx + 1}: ${c.headline} — ${c.incidentIds.length} incidents`);

            const delay =
                c.totalDelaySeconds != null && c.totalDelaySeconds > 0 ? formatDelay(c.totalDelaySeconds) : null;
            const trendIcon = TREND_ICONS[c.trend ?? 'unknown'] ?? '';

            el.innerHTML = [
                '<span class="cluster-pin-bg"></span>',
                `<span class="cluster-pin-number">${idx + 1}</span>`,
                '<span class="cluster-pin-body">',
                delay ? `<span class="cluster-pin-delay">${delay}</span>` : '',
                `<span class="cluster-pin-count">${c.incidentIds.length} inc</span>`,
                '</span>',
                trendIcon ? `<span class="cluster-pin-trend">${trendIcon}</span>` : '',
            ].join('');

            el.addEventListener('click', (e) => {
                e.stopPropagation();
                this.options.onClick?.(c);
            });
            const marker = new Marker({ element: el, anchor: 'center' }).setLngLat(c.centroid).addTo(this.map);
            this.markers.push(marker);
        });
    }

    remove(): void {
        if (this.removed) return;
        this.removed = true;
        for (const m of this.markers) m.remove();
        this.markers = [];
    }
}
