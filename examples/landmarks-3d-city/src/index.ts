import { TomTomConfig } from '@tomtom-org/maps-sdk/core';
import { StylingFoundationsModule, TomTomMap } from '@tomtom-org/maps-sdk/map';
import { Buildings3D, GLSurfaces, Landmarks3D } from '@tomtom-org/maps-sdk-plugin-landmarks-3d';
import './style.css';
import { API_KEY } from './config';

// (Set your own API key when working in your own environment)
TomTomConfig.instance.put({ apiKey: API_KEY, language: 'en-GB' });

// Where the sun stands at an hour from 6:00 to 20:00: rising in the east, highest at 13:00 in the
// south, setting in the west.
const sunAt = (hour: number) => {
    const day = (hour - 6) / 14;
    return {
        direction: Math.round(90 + 180 * day),
        altitude: Math.round(5 + 55 * Math.sin(Math.PI * day)),
        alignment: 'map' as const,
    };
};

(async () => {
    // The Eiffel Tower over the Champ de Mars, the Seine behind it.
    const map = new TomTomMap({
        mapLibre: { container: 'sdk-map', center: [2.2951, 48.8577], zoom: 15.9, pitch: 50, bearing: -40 },
    });

    // The ground: the Seine rippling, the lawns striped and 3D trees standing on them, under the labels.
    // The waves and the trees hold still for readers who ask for less motion.
    new GLSurfaces(map, matchMedia('(prefers-reduced-motion: reduce)').matches ? { wind: { speedFactor: 0 } } : {});
    // The city: the base map's buildings, with windows and the shadows they cast.
    new Buildings3D(map);
    // The Eiffel Tower and its neighbours, from Orbis 3D Landmarks, in the buildings' light and shadows.
    new Landmarks3D(map);

    // One sun for all three: the map's light, which each follows while its own light knobs are unset.
    const hour = document.querySelector('#ui-hour') as HTMLInputElement;
    const hourValue = document.querySelector('#ui-hour-value') as HTMLElement;
    const styling = await StylingFoundationsModule.get(map, { view: { light: sunAt(Number(hour.value)) } });
    const showHour = () => {
        hourValue.textContent = `${hour.value}:00`;
        styling.updateConfig({ view: { light: sunAt(Number(hour.value)) } });
    };
    hour.addEventListener('input', showHour);
    showHour();

    // A dark style turns all three to night: lit windows, a darker ground and the moon's light.
    const night = document.querySelector('#ui-night') as HTMLInputElement;
    night.addEventListener('change', () => map.setStyle(night.checked ? 'streetDark' : 'streetLight'));
})();
