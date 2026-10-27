import { TomTomConfig } from '@tomtom-org/maps-sdk/core';
import { TomTomMap } from '@tomtom-org/maps-sdk/map';
import { Buildings3D, GLSurfaces, Landmarks3D } from '@tomtom-org/maps-sdk-plugin-landmarks-3d';
import { MapEffects } from '@tomtom-org/maps-sdk-plugin-map-effects';
import './style.css';
import { API_KEY } from './config';

// (Set your own API key when working in your own environment)
TomTomConfig.instance.put({ apiKey: API_KEY, language: 'en-GB' });

// Westminster at night, the Houses of Parliament on the Thames.
const map = new TomTomMap({
    style: 'streetDark',
    mapLibre: { container: 'sdk-map', center: [-0.1222, 51.5003], zoom: 15.8, pitch: 60, bearing: -100 },
});

// On a dark style, all three turn to night under the moon: the river moving in its light, lit
// windows, and the Houses of Parliament among them. The water holds still for readers who ask for
// less motion.
new GLSurfaces(map, matchMedia('(prefers-reduced-motion: reduce)').matches ? { wind: { speedFactor: 0 } } : {});
new Buildings3D(map);
new Landmarks3D(map);

// The lit windows glowing, and the main roads streaking like street lights.
new MapEffects(map, { bloom: { intensity: 0.8 }, glare: { intensity: 0.6 } });
