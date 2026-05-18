import { TomTomConfig } from '@tomtom-org/maps-sdk/core';
import { CustomGeoJSONModule, TomTomMap } from '@tomtom-org/maps-sdk/map';
import type { FeatureCollection, Point, Polygon } from 'geojson';
import './style.css';
import { API_KEY } from './config';
import { pointLayers, polygonLayers } from './layers';
import { generatePoints, generatePolygons, type PointProps, type PolygonProps } from './mockData';
import { initTogglePanel } from './togglePanel';

TomTomConfig.instance.put({ apiKey: API_KEY });

const map = new TomTomMap({
    mapLibre: {
        container: 'sdk-map',
        center: [-0.1276, 51.5074],
        zoom: 10,
    },
});

type Sources = {
    points: FeatureCollection<Point, PointProps>;
    polygons: FeatureCollection<Polygon, PolygonProps>;
};

const showSelection = (html: string) => {
    (document.querySelector('#sdk-example-selection') as HTMLDivElement).innerHTML = html;
};

(async () => {
    const points = generatePoints(20_000);
    const polygons = generatePolygons(8);

    const customGeoJSON = await CustomGeoJSONModule.get<Sources>(map, {
        sources: {
            points: {
                cluster: { cluster: true, clusterRadius: 50, clusterMaxZoom: 14 },
                layers: pointLayers,
            },
            polygons: { layers: polygonLayers },
        },
    });

    await customGeoJSON.show(points, 'points');
    await customGeoJSON.show(polygons, 'polygons');

    customGeoJSON.events.points.on('click', (feature, _lngLat, features) => {
        // Clusters are synthetic MapLibre features that don't live in the source's
        // shownFeatures list, so the first argument can be undefined when clicking one.
        // Fall back to the raw rendered feature in `features[0]`.
        const properties = feature?.properties ?? features[0]?.properties ?? {};
        if (properties.cluster) {
            showSelection(`<strong>Cluster</strong>${properties.point_count} points`);
        } else {
            showSelection(`<strong>Point #${properties.id}</strong>value ${properties.value}`);
        }
    });

    customGeoJSON.events.polygons.on('click', (feature) => {
        const { name, id } = (feature.properties ?? {}) as PolygonProps;
        showSelection(`<strong>${name}</strong>polygon id ${id}`);
    });

    initTogglePanel();
})();
