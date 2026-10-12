/** One cell of the grid: a map container under a caption panel. */
export type MapTile = { container: HTMLElement; title: HTMLElement };

export const addMapTile = (grid: HTMLElement): MapTile => {
    const tile = document.createElement('figure');
    tile.className = 'ui-map-tile';
    const container = document.createElement('div');
    container.className = 'ui-map-tile-map';
    const caption = document.createElement('figcaption');
    caption.className = 'ui-panel ui-panel-top-left ui-map-tile-label';
    const title = document.createElement('h3');
    caption.append(title);
    tile.append(container, caption);
    grid.append(tile);
    return { container, title };
};
