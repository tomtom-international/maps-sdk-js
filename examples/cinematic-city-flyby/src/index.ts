import { TomTomConfig } from '@tomtom-org/maps-sdk/core';
import {
    BaseMapModule,
    POIsModule,
    type StandardStyleID,
    StylingFoundationsModule,
    TerrainModule,
    TomTomMap,
} from '@tomtom-org/maps-sdk/map';
import { calculateRoute } from '@tomtom-org/maps-sdk/services';
import { Buildings3D, GLSurfaces, Landmarks3D } from '@tomtom-org/maps-sdk-plugin-landmarks-3d';
import { MapEffects } from '@tomtom-org/maps-sdk-plugin-map-effects';
import { deriveMapColors } from '@tomtom-org/maps-sdk-plugin-map-theme';
import { type CameraOptions, LngLat } from 'maplibre-gl';
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
// How slowly the map's centre follows the ground over the terrain: it closes most of the way in this long.
const GROUND_EASE_SECONDS = 1.5;
// The centre stays at least this far below the camera, where its view would otherwise meet the ground.
const MIN_CLEARANCE_METERS = 10;

const wait = (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds));

// A landscape's turns are kilometres across, so it is flown faster than a city.
const speedFactorOf = (flyby: Flyby): number => (flyby.group === 'Landscapes' ? flyby.speedFactor : 1);

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
        path = routedStreets(flyby).then((streets) => new FlightPath(flyby.legs, streets, speedFactorOf(flyby)));
        flightPaths.set(flyby, path);
    }
    return path;
};

(async () => {
    let selectedFlyby = flybys[0];
    // The sketch opens the flight while its streets are routed: the opening shot, at the first landmark, is the same.
    let path = new FlightPath(selectedFlyby.legs, undefined, speedFactorOf(selectedFlyby));
    let distance = path.openingDistance;
    let currentStyle: StandardStyleID = flybyThemes[0].style;

    const map = new TomTomMap({
        style: currentStyle,
        mapLibre: {
            container: 'sdk-map',
            maxPitch: 85,
            // The flight sets the centre's elevation itself, below.
            centerClampedToGround: false,
        },
    });
    const { mapLibreMap } = map;

    // Over the terrain, MapLibre puts the map's centre on whichever slope the view meets, so its
    // elevation, and the zoom the camera's altitude gives with it, jump from one frame to the next; the
    // terrain's detail and every zoom-dependent layer jump with them. The flight eases the centre's
    // elevation instead, starting afresh on a cut.
    let centerElevation: number | undefined;
    const cameraOptions = (seconds?: number): CameraOptions => {
        const { lngLat, altitude, bearing, pitch, roll } = path.cameraAt(distance);
        const options = mapLibreMap.calculateCameraOptionsFromCameraLngLatAltRotation(
            lngLat,
            altitude,
            bearing,
            pitch,
            roll,
        );
        if (!mapLibreMap.getTerrain() || !options.center) return options;

        const ground = mapLibreMap.queryTerrainElevation(options.center) ?? 0;
        const eased =
            seconds === undefined || centerElevation === undefined
                ? ground
                : centerElevation + (ground - centerElevation) * (1 - Math.exp(-seconds / GROUND_EASE_SECONDS));
        centerElevation = Math.min(eased, altitude - MIN_CLEARANCE_METERS);
        // The options hold the centre at the elevation the map has now: slide it along the view to the
        // eased one, and zoom by the distance it gained, so the camera stays where the flight puts it.
        const scale = (altitude - centerElevation) / (altitude - (options.elevation ?? 0));
        const center = LngLat.convert(options.center);
        return {
            ...options,
            center: new LngLat(
                lngLat[0] + (center.lng - lngLat[0]) * scale,
                lngLat[1] + (center.lat - lngLat[1]) * scale,
            ),
            zoom: (options.zoom ?? 0) - Math.log2(scale),
            elevation: centerElevation,
        };
    };
    const caption = document.querySelector('#ui-caption') as HTMLElement;
    const showCamera = (seconds?: number) => {
        mapLibreMap.jumpTo(cameraOptions(seconds));
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
    // The trees grow over the landscapes alone: from the rooftops a city's parks are a few pixels each,
    // and the frame goes to the buildings.
    const applySurfaces = (theme: FlybyTheme, flyby: Flyby) => {
        surfaces.applyConfig({
            ...theme.surfaces,
            trees: { ...theme.surfaces?.trees, visible: flyby.group === 'Landscapes' },
            visible: surfacesShowFor(theme),
            ...(reducedMotion && { wind: { speedFactor: 0 } }),
        });
    };
    let selectedTheme: FlybyTheme | undefined;
    const applyTheme = async (theme: FlybyTheme) => {
        if (selectedTheme?.pass) effects.removePass(selectedTheme.pass.id);
        selectedTheme = theme;
        // Each plugin takes the theme's whole config: what a theme leaves out goes back to its default.
        // Street names lie flat on the ground, so they hide behind the buildings in front.
        buildings.applyConfig({ ...theme.buildings, roadLabels: { occluded: true } });
        applySurfaces(theme, selectedFlyby);
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
        // One sun on the map lights the buildings, the landmarks and the ground, so the trees stand in the
        // buildings' shadows. It stays put as the camera turns.
        styling.applyConfig({
            colors,
            view: { sky: skyOf(theme, colors), light: { ...theme.sun, alignment: 'map' } },
            labels: { customTypeface: theme.font },
        });
    };
    // Each place opens in the look that shows it best, which the reader can change until the next place.
    const themeSelect = document.querySelector('#ui-theme') as HTMLSelectElement;
    const applyLookOf = (flyby: Flyby) => {
        const look = flybyThemes.find(({ label }) => label === flyby.look) ?? flybyThemes[0];
        themeSelect.value = String(flybyThemes.indexOf(look));
        return applyTheme(look);
    };

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
        // An ease back to the old path, still running, must not start the flight under the fade.
        flightRequests++;
        fade.classList.add('ui-fade-out');
        await wait(FADE_MS);
        if (selectedFlyby !== flyby) return;

        path = nextPath;
        distance = path.openingDistance;
        terrain.setElevationVisible(flyby.group === 'Landscapes');
        void applyLookOf(flyby);
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
    surfacesToggle.addEventListener(
        'change',
        () => selectedTheme && surfaces.setVisible(surfacesShowFor(selectedTheme)),
    );
    initTogglePanel();

    await applyLookOf(selectedFlyby);
    // The flight starts once the opening city's streets are routed, or with a city the reader picks meanwhile,
    // unless they take the camera first.
    flyToggle.checked = !reducedMotion;
    const opening = selectedFlyby;
    const routedPath = await flightPathOf(opening);
    if (selectedFlyby !== opening) return;

    path = routedPath;
    if (flyToggle.checked) setFlying(true);
})();
