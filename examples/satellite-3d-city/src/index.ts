import { TomTomConfig } from '@tomtom-org/maps-sdk/core';
import { StylingFoundationsModule, TomTomMap } from '@tomtom-org/maps-sdk/map';
import { Buildings3D, GLSurfaces, Landmarks3D } from '@tomtom-org/maps-sdk-plugin-landmarks-3d';
import './style.css';
import { API_KEY } from './config';

// (Set your own API key when working in your own environment)
TomTomConfig.instance.put({ apiKey: API_KEY, language: 'en-GB' });

// Sydney Harbour from over the water, the Opera House on its point before the city.
const map = new TomTomMap({
    style: 'streetSatellite',
    mapLibre: { container: 'sdk-map', center: [151.2135, -33.8575], zoom: 15.6, pitch: 58, bearing: 150 },
});

// The water moving and 3D trees standing in the parks, over the imagery. Still for readers who ask
// for less motion.
new GLSurfaces(map, matchMedia('(prefers-reduced-motion: reduce)').matches ? { wind: { speedFactor: 0 } } : {});
// The base map's buildings in 3D, with windows and shadows.
new Buildings3D(map);
// The Harbour Bridge, the Opera House and their neighbours, from Orbis 3D Landmarks.
new Landmarks3D(map);

// One sun for all three, the map's light, from the direction the camera looks and high enough for the
// harbour in front of it to glint.
StylingFoundationsModule.get(map, { view: { light: { direction: 150, altitude: 48, alignment: 'map' } } });
