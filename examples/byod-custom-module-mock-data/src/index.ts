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
    (document.querySelector('#ui-selection') as HTMLDivElement).innerHTML = html;
};

(async () => {
    const points = generatePoints(20_000);
    const polygons = generatePolygons(8);

    const customGeoJSON = await CustomGeoJSONModule.create<Sources>(map, {
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

    customGeoJSON.events.points.on('click', (feature) => {
        // A cluster is not among the shown features, so the first argument is then the rendered
        // MapLibre cluster feature, its properties carrying `cluster` and `point_count`.
        const properties = feature.properties ?? {};
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
