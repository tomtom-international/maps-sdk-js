import type { StandardStyleID, TomTomMap } from '@tomtom-org/maps-sdk/map';
import { standardStyleIDs } from '@tomtom-org/maps-sdk/map';

const PITCH_3D = 45;
const PITCH_2D = 0;

export const initMapControls = (map: TomTomMap): void => {
    const toggle = document.getElementById('toggle-3d') as HTMLButtonElement;
    let is3d = true;

    toggle.addEventListener('click', () => {
        is3d = !is3d;
        toggle.textContent = is3d ? '3D' : '2D';
        toggle.classList.toggle('active', is3d);
        map.mapLibreMap.easeTo({ pitch: is3d ? PITCH_3D : PITCH_2D, duration: 400 });
    });

    const styleSelect = document.getElementById('style-switcher') as HTMLSelectElement;
    standardStyleIDs.forEach((id) => styleSelect.add(new Option(id)));
    styleSelect.addEventListener('change', () => {
        map.setStyle(styleSelect.value as StandardStyleID);
    });
};
