import type {
    AreaAnalyticsDisplayMode,
    AreaAnalyticsDisplayProperties,
    TomTomMap,
    TrafficAreaAnalyticsModule,
} from '@tomtom-org/maps-sdk/map';
import type { Feature, Polygon } from 'geojson';

type Cell = Feature<Polygon, AreaAnalyticsDisplayProperties>;
type Grid = 'hexgrid' | 'square';

// The heatmap draws no cells to select.
const gridOf = (mode: AreaAnalyticsDisplayMode | undefined): Grid | undefined => {
    if (mode?.startsWith('hexgrid')) return 'hexgrid';
    if (mode?.startsWith('square')) return 'square';
    return undefined;
};

// A cell's ring ends on its first vertex again, which must not count twice.
const centreOf = ({ geometry }: Cell): [number, number] => {
    const vertices = geometry.coordinates[0].slice(1);
    const sum = vertices.reduce(
        ([longitude, latitude], vertex) => [longitude + vertex[0], latitude + vertex[1]],
        [0, 0],
    );
    return [sum[0] / vertices.length, sum[1] / vertices.length];
};

const distanceBetween = (cell: Cell, [longitude, latitude]: [number, number]) => {
    const [cellLongitude, cellLatitude] = centreOf(cell);
    return Math.hypot(cellLongitude - longitude, cellLatitude - latitude);
};

/**
 * Selects a cell when it is clicked or picked from the panel, and keeps the selection in place
 * when the visualization switches between the hexagon and the square grid.
 */
export const initCellSelection = (
    map: TomTomMap,
    analyticsModule: TrafficAreaAnalyticsModule,
    busiestCellButton: HTMLButtonElement,
): void => {
    const cellsOf = (grid: Grid | undefined): Cell[] => (grid ? analyticsModule.getShown()[grid].features : []);
    // The grid last drawn, which keeps the selection while the heatmap shows.
    let grid = gridOf(analyticsModule.getConfig()?.displayMode);

    // A click marks the cell it lands on once the module handles clicks.
    analyticsModule.events.on('click', () => {});

    busiestCellButton.addEventListener('click', () => {
        const [busiest] = cellsOf(grid).toSorted(
            (cell, other) => (other.properties.congestionLevel ?? 0) - (cell.properties.congestionLevel ?? 0),
        );
        if (!busiest) return;

        analyticsModule.setEventState({ id: busiest.properties.id, state: 'click' });
        map.mapLibreMap.easeTo({
            center: centreOf(busiest),
            zoom: Math.max(map.mapLibreMap.getZoom(), 14),
            duration: 800,
        });
    });

    analyticsModule.events.on('config-change', (config) => {
        busiestCellButton.disabled = config?.displayMode === 'heatmap';
        const nextGrid = gridOf(config?.displayMode);
        if (!nextGrid || nextGrid === grid) return;

        const previousGrid = grid;
        grid = nextGrid;
        const { click = [] } = analyticsModule.getEventStates();
        const selected = cellsOf(previousGrid).find((cell) => click.includes(cell.properties.id));
        if (!selected) return;

        const selectedCentre = centreOf(selected);
        const [nearest] = cellsOf(grid).toSorted(
            (cell, other) => distanceBetween(cell, selectedCentre) - distanceBetween(other, selectedCentre),
        );
        if (nearest) analyticsModule.setEventState({ id: nearest.properties.id, state: 'click' });
    });
};
