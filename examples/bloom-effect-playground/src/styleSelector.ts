import { type StandardStyleID, standardStyleIDs } from '@tomtom-org/maps-sdk/map';

/** Fills the style dropdown and reports every pick; a scope re-reads its colours from each style. */
export const initStyleSelector = (selected: StandardStyleID, onPick: (style: StandardStyleID) => void): void => {
    const selector = document.querySelector('#ui-style') as HTMLSelectElement;
    selector.innerHTML = standardStyleIDs
        .map((id) => `<option value="${id}"${id === selected ? ' selected' : ''}>${id}</option>`)
        .join('');
    selector.addEventListener('change', () => onPick(selector.value as StandardStyleID));
};
