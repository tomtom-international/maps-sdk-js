import { type Map as MapLibreMap, Marker } from 'maplibre-gl';
import type { Cluster } from '../agent/types';

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
            if (!c.centroid || c.centroid[0] === 0) return;
            const el = document.createElement('button');
            el.type = 'button';
            el.className = 'cluster-pin';
            el.title = `${c.headline} — ${c.incidentIds.length} incidents`;
            el.setAttribute('aria-label', `Cluster ${idx + 1}: ${c.headline}`);
            el.innerHTML = `<span class="cluster-pin-ring"></span><span class="cluster-pin-num">${idx + 1}</span>`;
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
