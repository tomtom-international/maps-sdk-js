import { TomTomConfig } from '@tomtom-org/maps-sdk/core';
import {
    BaseMapModule,
    POIsModule,
    StylingFoundationsModule,
    TerrainModule,
    TomTomMap,
} from '@tomtom-org/maps-sdk/map';
import { Buildings3D, GLSurfaces, Landmarks3D } from '@tomtom-org/maps-sdk-plugin-landmarks-3d';
import { MapEffects } from '@tomtom-org/maps-sdk-plugin-map-effects';
import './style.css';
import { API_KEY } from './config';
import { FlightPath } from './flight';
import { type Flyby, flybys, speedFactorOf } from './flybys';
import { groundCamera } from './groundCamera';
import { createLooks } from './looks';
import { flightPathOf } from './routedPath';
import { fillSelect } from './selects';
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

(async () => {
    let selectedFlyby = flybys[0];
    // The sketch opens the flight while its streets are routed: the opening shot, at the first landmark, is the same.
    let path = new FlightPath(selectedFlyby.legs, undefined, speedFactorOf(selectedFlyby));
    let distance = path.openingDistance;

    const map = new TomTomMap({
        style: flybyThemes[0].style,
        mapLibre: {
            container: 'sdk-map',
            maxPitch: 85,
            // The flight sets the centre's elevation itself, below.
            centerClampedToGround: false,
        },
    });
    const { mapLibreMap } = map;
    const camera = groundCamera(mapLibreMap);

    const caption = document.querySelector('#ui-caption') as HTMLElement;
    const showCamera = (seconds?: number) => {
        mapLibreMap.jumpTo(camera.optionsAt(path, distance, seconds));
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
    // The landscapes are flown over the 3D terrain, raised while one shows.
    const terrain = await TerrainModule.get(map);
    // The water, woods, fields and sand under the flight, and the trees on them, standing on the terrain
    // too; the waves and the trees hold still under reduced motion.
    const surfaces = new GLSurfaces(map);
    const surfacesToggle = document.querySelector('#ui-surfaces') as HTMLInputElement;
    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const surfacesShowFor = (theme: FlybyTheme) => surfacesToggle.checked && theme.surfaces?.visible !== false;
    const themeSelect = document.querySelector('#ui-theme') as HTMLSelectElement;
    const { applyTheme, applyLookOf, syncSurfaces } = createLooks({
        map,
        styling,
        buildings,
        landmarks,
        effects,
        surfaces,
        surfacesShowFor,
        flyby: () => selectedFlyby,
        themeSelect,
        reducedMotion,
    });

    // The flight: each frame moves along the path at its speed there, and places the camera from it.
    let animationFrame = 0;
    let lastFrame = 0;
    const fly = (now: number) => {
        const seconds = Math.min(MAX_FRAME_SECONDS, (now - lastFrame) / 1000);
        lastFrame = now;
        distance = (distance + path.speedAt(distance) * seconds) % path.length;
        showCamera(seconds);
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
        // The reader's own camera sits on the ground again, as MapLibre keeps it.
        mapLibreMap.setCenterClampedToGround(!flying);
        const request = ++flightRequests;
        if (!flying) return;

        // Under reduced motion the ease ends at once, so its end is listened for first.
        mapLibreMap.once('moveend', () => request === flightRequests && startFlight());
        mapLibreMap.easeTo({ ...camera.optionsAt(path, distance), duration: EASE_BACK_MS });
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
        // An ease back to the old path, still running, must not start the flight under the fade.
        flightRequests++;
        fade.classList.add('ui-fade-out');
        await wait(FADE_MS);
        if (selectedFlyby !== flyby) return;

        path = nextPath;
        distance = path.openingDistance;
        terrain.setElevationVisible(flyby.group === 'Landscapes');
        if (flyby.group === 'Landscapes') {
            // Place the camera while the satellite style loads. Holding the cut until it finishes
            // keeps the terrain picture moving for longer than it holds still.
            void applyLookOf(flyby);
            showCamera();
        } else {
            // A centre left at a mountain height puts a city camera below it 10 km out, under the zoom
            // the buildings draw at. The new style can put that height back, so the camera follows the look,
            // and the next look starts only after this one has placed it.
            await applyLookOf(flyby, () => {
                if (selectedFlyby !== flyby) return;
                camera.dropRaisedCentre();
                showCamera();
            });
            if (selectedFlyby !== flyby) return;
        }
        await Promise.race([mapLibreMap.once('idle'), wait(MAX_SETTLE_MS)]);
        if (selectedFlyby !== flyby) return;

        fade.classList.remove('ui-fade-out');
        if (flyToggle.checked) startFlight();
    };

    fillSelect('#ui-flyby', flybys, (index) => showFlyby(flybys[index]));
    fillSelect('#ui-theme', flybyThemes, (index) => applyTheme(flybyThemes[index]));
    surfacesToggle.addEventListener('change', syncSurfaces);
    initTogglePanel();

    await applyLookOf(selectedFlyby);
    // The flight starts once the opening city's streets are routed, or with a city the reader picks meanwhile,
    // unless they take the camera first.
    flyToggle.checked = !reducedMotion;
    const opening = selectedFlyby;
    const routedOpening = await flightPathOf(opening);
    if (selectedFlyby !== opening) return;

    path = routedOpening;
    if (flyToggle.checked) setFlying(true);
})();
