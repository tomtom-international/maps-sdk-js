import { TomTomConfig } from '@tomtom-org/maps-sdk/core';
import {
    BaseMapModule,
    POIsModule,
    type StandardStyleID,
    StylingFoundationsModule,
    TomTomMap,
} from '@tomtom-org/maps-sdk/map';
import { calculateRoute } from '@tomtom-org/maps-sdk/services';
import { Buildings3D, Landmarks3D } from '@tomtom-org/maps-sdk-plugin-landmarks-3d';
import { MapEffects } from '@tomtom-org/maps-sdk-plugin-map-effects';
import { deriveMapColors } from '@tomtom-org/maps-sdk-plugin-map-theme';
import './style.css';
import { API_KEY } from './config';
import { FlightPath } from './flight';
import { type Flyby, flybys } from './flybys';
import { skyOf } from './sky';
import { type FlybyTheme, flybyThemes } from './themes';
import { initTogglePanel } from './togglePanel';

// (Set your own API key when working in your own environment)
TomTomConfig.instance.put({ apiKey: API_KEY, language: 'en-GB' });

const FADE_MS = 600;
// A new city fades in once its tiles have loaded, or after this long.
const MAX_SETTLE_MS = 3000;
const EASE_BACK_MS = 1200;
// The first frame after a stall, such as a hidden tab, flies no further than this.
const MAX_FRAME_SECONDS = 0.1;

const wait = (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds));

// Each street run's sketch goes to the routing service as a path to follow, and comes back on the roads.
const routedStreets = async (flyby: Flyby): Promise<Map<number, [number, number][]>> => {
    const streets = new Map<number, [number, number][]>();
    await Promise.all(
        flyby.legs.map(async (leg, index) => {
            if (leg.kind !== 'street') return;
            try {
                const routes = await calculateRoute({ locations: [leg.path] });
                streets.set(
                    index,
                    routes.features[0].geometry.coordinates.map(([lng, lat]) => [lng, lat]),
                );
            } catch (error) {
                console.warn(`${leg.label} flies its sketch: the route failed.`, error);
            }
        }),
    );
    return streets;
};

const flightPaths = new Map<Flyby, Promise<FlightPath>>();
const flightPathOf = (flyby: Flyby): Promise<FlightPath> => {
    let path = flightPaths.get(flyby);
    if (!path) {
        path = routedStreets(flyby).then((streets) => new FlightPath(flyby.legs, streets));
        flightPaths.set(flyby, path);
    }
    return path;
};

(async () => {
    let selectedFlyby = flybys[0];
    // The sketch opens the flight while its streets are routed: the opening shot, at the first landmark, is the same.
    let path = new FlightPath(selectedFlyby.legs);
    let distance = path.openingDistance;
    let currentStyle: StandardStyleID = flybyThemes[0].style;

    const map = new TomTomMap({
        style: currentStyle,
        mapLibre: {
            container: 'sdk-map',
            maxPitch: 85,
        },
    });
    const { mapLibreMap } = map;

    const cameraOptions = () => {
        const { lngLat, altitude, bearing, pitch, roll } = path.cameraAt(distance);
        return mapLibreMap.calculateCameraOptionsFromCameraLngLatAltRotation(lngLat, altitude, bearing, pitch, roll);
    };
    const caption = document.querySelector('#ui-caption') as HTMLElement;
    const showCamera = () => {
        mapLibreMap.jumpTo(cameraOptions());
        const label = path.labelAt(distance);
        if (caption.dataset.label !== label) {
            caption.dataset.label = label;
            caption.innerHTML = `<span class="ui-caption-city">${selectedFlyby.label}</span>${label}`;
        }
    };
    showCamera();

    const styling = await StylingFoundationsModule.get(map);
    // The city from above: its place and street names stay, its shields, house numbers and POIs go.
    await BaseMapModule.get(map, { groups: { roadShields: { visible: false }, houseNumbers: { visible: false } } });
    await POIsModule.get(map, { visible: false });
    const landmarks = new Landmarks3D(map);
    const buildings = new Buildings3D(map);
    const effects = new MapEffects(map);
    let selectedTheme: FlybyTheme | undefined;
    const applyTheme = async (theme: FlybyTheme) => {
        if (selectedTheme?.pass) effects.removePass(selectedTheme.pass.id);
        selectedTheme = theme;
        // Each plugin takes the theme's whole config: what a theme leaves out goes back to its default.
        // Street names lie flat on the ground, so they hide behind the buildings in front.
        buildings.applyConfig({ ...theme.buildings, roadLabels: { occluded: true } });
        landmarks.applyConfig(theme.landmarks);
        effects.applyConfig(theme.effects);
        if (theme.pass) effects.addPass(theme.pass);

        if (theme.style !== currentStyle) {
            currentStyle = theme.style;
            await map.setStyle(theme.style);
        }
        // A quicker pick has replaced this theme while its style loaded.
        if (selectedTheme !== theme) return;
        const colors = deriveMapColors(theme.theme.colors, { mode: theme.theme.mode });
        styling.applyConfig({ colors, view: { sky: skyOf(theme, colors) }, labels: { customTypeface: theme.font } });
    };

    // The flight: each frame moves along the path at its speed there, and places the camera from it.
    let animationFrame = 0;
    let lastFrame = 0;
    const fly = (now: number) => {
        const seconds = Math.min(MAX_FRAME_SECONDS, (now - lastFrame) / 1000);
        lastFrame = now;
        distance = (distance + path.speedAt(distance) * seconds) % path.length;
        showCamera();
        animationFrame = requestAnimationFrame(fly);
    };
    const startFlight = () => {
        cancelAnimationFrame(animationFrame);
        lastFrame = performance.now();
        animationFrame = requestAnimationFrame(fly);
    };

    const flyToggle = document.querySelector('#ui-fly') as HTMLInputElement;
    // Counts the requests to fly, so an ease back to the path starts the flight only if no other request came since.
    let flightRequests = 0;
    const setFlying = (flying: boolean) => {
        flyToggle.checked = flying;
        cancelAnimationFrame(animationFrame);
        const request = ++flightRequests;
        if (!flying) return;
        // Under reduced motion the ease ends at once, so its end is listened for first.
        mapLibreMap.once('moveend', () => request === flightRequests && startFlight());
        mapLibreMap.easeTo({ ...cameraOptions(), duration: EASE_BACK_MS });
    };
    flyToggle.addEventListener('change', () => setFlying(flyToggle.checked));
    // Grabbing, scrolling or a key on the map hands the camera to the reader, before the map's own handlers see it.
    for (const type of ['pointerdown', 'wheel', 'keydown']) {
        mapLibreMap.getContainer().addEventListener(type, () => setFlying(false), { capture: true });
    }

    // A new city is a cut: fade out, move, and fade in on the new city once its tiles are in.
    const fade = document.querySelector('#ui-fade') as HTMLElement;
    const showFlyby = async (flyby: Flyby) => {
        selectedFlyby = flyby;
        const nextPath = await flightPathOf(flyby);
        if (selectedFlyby !== flyby) return;
        cancelAnimationFrame(animationFrame);
        fade.classList.add('ui-fade-out');
        await wait(FADE_MS);
        if (selectedFlyby !== flyby) return;
        path = nextPath;
        distance = path.openingDistance;
        showCamera();
        await Promise.race([mapLibreMap.once('idle'), wait(MAX_SETTLE_MS)]);
        if (selectedFlyby !== flyby) return;
        fade.classList.remove('ui-fade-out');
        if (flyToggle.checked) startFlight();
    };

    // Consecutive options of the same group go under one heading.
    const fillSelect = (id: string, options: { label: string; group?: string }[], onPick: (index: number) => void) => {
        const select = document.querySelector(id) as HTMLSelectElement;
        let parent: HTMLElement = select;
        options.forEach(({ label, group }, index) => {
            if (group && group !== options[index - 1]?.group) {
                parent = select.appendChild(Object.assign(document.createElement('optgroup'), { label: group }));
            }
            parent.appendChild(new Option(label, String(index)));
        });
        select.addEventListener('change', () => onPick(Number(select.value)));
    };
    fillSelect('#ui-flyby', flybys, (index) => showFlyby(flybys[index]));
    fillSelect('#ui-theme', flybyThemes, (index) => applyTheme(flybyThemes[index]));
    initTogglePanel();

    await applyTheme(flybyThemes[0]);
    // The flight starts once the opening city's streets are routed, or with a city the reader picks meanwhile,
    // unless they take the camera first.
    flyToggle.checked = !matchMedia('(prefers-reduced-motion: reduce)').matches;
    const opening = selectedFlyby;
    const routedPath = await flightPathOf(opening);
    if (selectedFlyby !== opening) return;
    path = routedPath;
    if (flyToggle.checked) setFlying(true);
})();
