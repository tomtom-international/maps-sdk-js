import type { Place, Route } from '@tomtom-org/maps-sdk/core';
import { bboxFromGeoJSON, formatDistance, formatDuration, TomTomConfig } from '@tomtom-org/maps-sdk/core';
import {
    RoutingModule,
    StylingFoundationsModule,
    setKnob,
    TerrainModule,
    TomTomMap,
    terrainKnobCatalogue,
} from '@tomtom-org/maps-sdk/map';
import type { RouteType } from '@tomtom-org/maps-sdk/services';
import { calculateRoute, createLatestRequest, geocodeOne } from '@tomtom-org/maps-sdk/services';
import type { FlyoverAim, FlyoverProgress, FlyoverZoom } from '@tomtom-org/maps-sdk-plugin-flyover';
import { anchorForPitch, RouteFlyover } from '@tomtom-org/maps-sdk-plugin-flyover';
import { MapEffects } from '@tomtom-org/maps-sdk-plugin-map-effects';
import './style.css';
import { API_KEY } from './config';
import { initPlaceSearchBox } from './placeSearchBox';
import { initTogglePanel } from './togglePanel';

// (Set your own API key when working in your own environment)
TomTomConfig.instance.put({ apiKey: API_KEY, language: 'en-GB' });

// The Grand St Bernard pass: two valley towns 80 km apart, with 2,400 metres of climb in between.
const INITIAL_ORIGIN = 'Martigny, Switzerland';
const INITIAL_DESTINATION = 'Aosta, Italy';

// `formatDuration` reports nothing under half a minute, which the readout still has to fill.
const durationLabel = (seconds: number) => formatDuration(seconds) ?? '0 min';

// A shallow field: a thin band around the marker stays sharp, the tarmac rushing past and the ridges
// beyond it soften hard, and lights out of focus open into discs.
const DEPTH_OF_FIELD = { 'depthOfField.intensity': 20, 'depthOfField.band': 0.08, 'depthOfField.bokeh': 1 } as const;

(async () => {
    const originInput = document.querySelector('#ui-origin') as HTMLInputElement;
    const originResults = document.querySelector('#ui-originResults') as HTMLUListElement;
    const destinationInput = document.querySelector('#ui-destination') as HTMLInputElement;
    const destinationResults = document.querySelector('#ui-destinationResults') as HTMLUListElement;
    const routeTypeSelector = document.querySelector('#ui-routeType') as HTMLSelectElement;
    const playPauseButton = document.querySelector('#ui-playPause') as HTMLButtonElement;
    const restartButton = document.querySelector('#ui-restart') as HTMLButtonElement;
    const status = document.querySelector('#ui-status') as HTMLElement;
    const progressReadout = document.querySelector('#ui-progress') as HTMLElement;
    const position = document.querySelector('#ui-position') as HTMLInputElement;
    const positionValue = document.querySelector('#ui-positionValue') as HTMLElement;
    const speed = document.querySelector('#ui-speed') as HTMLInputElement;
    const speedValue = document.querySelector('#ui-speedValue') as HTMLElement;
    const pitch = document.querySelector('#ui-pitch') as HTMLInputElement;
    const pitchValue = document.querySelector('#ui-pitchValue') as HTMLElement;
    const anchor = document.querySelector('#ui-anchor') as HTMLInputElement;
    const anchorValue = document.querySelector('#ui-anchorValue') as HTMLElement;
    const zoom = document.querySelector('#ui-zoom') as HTMLInputElement;
    const zoomValue = document.querySelector('#ui-zoomValue') as HTMLElement;
    const exaggeration = document.querySelector('#ui-exaggeration') as HTMLInputElement;
    const exaggerationValue = document.querySelector('#ui-exaggerationValue') as HTMLElement;
    const depthOfField = document.querySelector('#ui-depthOfField') as HTMLInputElement;
    const hillshade = document.querySelector('#ui-hillshade') as HTMLInputElement;
    const marker = document.querySelector('#ui-marker') as HTMLInputElement;
    const aimMode = document.querySelector('#ui-aimMode') as HTMLSelectElement;
    const aimPointsField = document.querySelector('#ui-aimPoints') as HTMLElement;
    const aimDistanceField = document.querySelector('#ui-aimDistance') as HTMLElement;
    const points = document.querySelector('#ui-points') as HTMLInputElement;
    const pointsValue = document.querySelector('#ui-pointsValue') as HTMLElement;
    const distance = document.querySelector('#ui-distance') as HTMLInputElement;
    const distanceValue = document.querySelector('#ui-distanceValue') as HTMLElement;
    const zoomMode = document.querySelector('#ui-zoomMode') as HTMLSelectElement;
    const zoomInstructionsField = document.querySelector('#ui-zoomInstructions') as HTMLElement;
    const zoomFixedField = document.querySelector('#ui-zoomFixed') as HTMLElement;
    const instructions = document.querySelector('#ui-instructions') as HTMLInputElement;
    const instructionsValue = document.querySelector('#ui-instructionsValue') as HTMLElement;

    // Typed as the wider `Place`: a geocoded endpoint is replaced by a searched one on every pick.
    let origin: Place = await geocodeOne(INITIAL_ORIGIN);
    let destination: Place = await geocodeOne(INITIAL_DESTINATION);

    const map = new TomTomMap({
        style: 'streetSatellite',
        mapLibre: {
            container: 'sdk-map',
            center: origin.geometry.coordinates as [number, number],
            zoom: Number(zoom.value),
            pitch: Number(pitch.value),
            // The fly-over lives above MapLibre's default 60° ceiling, where the relief closes in.
            maxPitch: 85,
            // The depth of field reads the rendered map back as a texture, which MapLibre allows
            // only when asked.
            canvasContextAttributes: { preserveDrawingBuffer: true },
        },
    });

    const [terrain, , routingModule] = await Promise.all([
        TerrainModule.get(map, {
            hillshade: { visible: true },
            elevation: {
                visible: true,
                // Unexaggerated: the flight is down in the valleys, where raised relief is the thing
                // the camera keeps hitting.
                exaggeration: Number(exaggeration.value),
            },
        }),
        StylingFoundationsModule.get(map, {
            'view.sky.visible': true,
            // The satellite basemap is a daylit photograph, but its dark labels put the style in
            // the dark theme, whose night sky sits oddly above sunlit rock.
            'view.sky.color': '#88c6fc',
            'view.sky.horizonColor': '#ffffff',
        }),
        RoutingModule.create(map, { summaryBubbles: { visible: false } }),
    ]);

    // The effects plugin reads the rendered pixels, so the defocus follows the flight with no
    // per-frame work of its own.
    const effects = new MapEffects(map);

    let route: Route | undefined;
    let flyover: RouteFlyover | undefined;
    let scrubbing = false;
    let lastProgressLabel = '';

    const showProgress = ({ traveledDistanceInMeters, traveledTimeInSeconds }: FlyoverProgress) => {
        const label = `${formatDistance(traveledDistanceInMeters)} · ${durationLabel(traveledTimeInSeconds)}`;
        if (label !== lastProgressLabel) {
            lastProgressLabel = label;
            progressReadout.textContent = label;
        }
        if (scrubbing || !route) return;

        const fraction = traveledDistanceInMeters / route.properties.summary.lengthInMeters;
        position.value = String(Math.round(fraction * 1000));
        positionValue.textContent = `${Math.round(fraction * 100)}%`;
    };

    // What a paused fly-over shows: the whole drive, tilted enough to read the relief it crosses.
    const showRouteOverview = (shownRoute: Route) => {
        const bounds = bboxFromGeoJSON(shownRoute);
        if (bounds) map.mapLibreMap.fitBounds(bounds, { padding: 60, pitch: 55, bearing: 0, duration: 1500 });
    };

    // The two camera modes, read off the panel. Each select shows only the sliders its mode uses,
    // so a mode with nothing to tune shows nothing.
    const currentAim = (): FlyoverAim => {
        switch (aimMode.value) {
            case 'points':
                return { mode: 'points', pointsAhead: Number(points.value) };
            case 'distance':
                return { mode: 'distance', metersAhead: Number(distance.value) };
            default:
                return { mode: 'instruction', fallbackMetersAhead: Number(distance.value) };
        }
    };

    const currentZoom = (): FlyoverZoom => {
        switch (zoomMode.value) {
            case 'fixed':
                return { mode: 'fixed', zoom: Number(zoom.value) };
            case 'speed':
                return { mode: 'speed' };
            default:
                return { mode: 'instructions', instructionsAhead: Number(instructions.value) };
        }
    };

    // Where the marker sits on screen. The plugin derives it from the pitch when it is not told, and
    // the slider shows that until someone drags it — after which the number on the slider is the
    // answer and the pitch stops moving it.
    let anchorPinned = false;

    const currentAnchor = () => ({ x: 0.5, y: Number(anchor.value) / 100 });

    const followPitchWithAnchor = () => {
        if (anchorPinned) return;

        anchor.value = String(Math.round(anchorForPitch(Number(pitch.value)).y * 100));
        anchorValue.textContent = `${anchor.value}%`;
    };

    const showModeFields = () => {
        aimPointsField.hidden = aimMode.value !== 'points';
        aimDistanceField.hidden = aimMode.value === 'points';
        zoomInstructionsField.hidden = zoomMode.value !== 'instructions';
        zoomFixedField.hidden = zoomMode.value !== 'fixed';
    };

    // A new pick retires the route the previous one left in flight, or the older answer flies last
    const latestPlan = createLatestRequest();

    const planRoute = async () => {
        status.textContent = 'Planning the route…';

        try {
            const plan = await latestPlan.run((signal) =>
                calculateRoute({
                    locations: [origin, destination],
                    costModel: { routeType: routeTypeSelector.value as RouteType, traffic: 'live' },
                    // The instructions are what the camera aims at and frames on, so the flight asks
                    // for guidance rather than working the junctions out from the geometry.
                    guidance: { type: 'coded' },
                    signal,
                }),
            );
            if (!plan.current) return;

            const routes = plan.value;
            route = routes.features[0];
            await routingModule.showRoutes(routes);
            await routingModule.showWaypoints([origin, destination]);

            const { lengthInMeters, travelTimeInSeconds } = route.properties.summary;
            status.textContent = `${formatDistance(lengthInMeters)} · ${durationLabel(travelTimeInSeconds)}`;

            if (flyover) {
                flyover.setRoute(route);
            } else {
                flyover = new RouteFlyover(map, {
                    route,
                    camera: {
                        speedKMH: Number(speed.value),
                        pitch: Number(pitch.value),
                        aim: currentAim(),
                        zoom: currentZoom(),
                        anchor: currentAnchor(),
                    },
                    onProgress: showProgress,
                });
            }
            if (!flyover.running) showRouteOverview(route);
        } catch {
            // A `thrilling` route is capped at 900 km, and no road connects every pair of places
            status.textContent = 'No route between these two places.';
        }
    };

    const flyoverPosition = (): [number, number] => map.mapLibreMap.getCenter().toArray();

    const originBox = initPlaceSearchBox(originInput, originResults, flyoverPosition, (place) => {
        origin = place;
        void planRoute();
    });
    const destinationBox = initPlaceSearchBox(destinationInput, destinationResults, flyoverPosition, (place) => {
        destination = place;
        void planRoute();
    });
    originBox.fill(origin);
    destinationBox.fill(destination);

    routeTypeSelector.addEventListener('change', () => void planRoute());

    const togglePlay = () => {
        if (!flyover) return;

        if (flyover.running) {
            flyover.stop();
        } else {
            flyover.start();
        }

        playPauseButton.textContent = flyover.running ? 'Pause' : 'Fly the route';
    };

    playPauseButton.addEventListener('click', togglePlay);

    restartButton.addEventListener('click', () => flyover?.seek(0));

    position.addEventListener('pointerdown', () => {
        scrubbing = true;
    });
    position.addEventListener('pointerup', () => {
        scrubbing = false;
    });
    position.addEventListener('input', () => {
        positionValue.textContent = `${Math.round(Number(position.value) / 10)}%`;
        flyover?.seek(Number(position.value) / 1000);
    });

    speed.addEventListener('input', () => {
        speedValue.textContent = `${speed.value} km/h`;
        flyover?.setCamera({ speedKMH: Number(speed.value) });
    });

    // The plane of focus sits on the marker. Focus counts up the frame from its bottom edge, and the
    // anchor down it from the top.
    const applyDepthOfField = () =>
        effects.applyConfig(
            depthOfField.checked ? { ...DEPTH_OF_FIELD, 'depthOfField.focus': 1 - currentAnchor().y } : {},
        );

    pitch.addEventListener('input', () => {
        pitchValue.textContent = `${pitch.value}°`;
        followPitchWithAnchor();
        flyover?.setCamera({ pitch: Number(pitch.value), anchor: currentAnchor() });
        applyDepthOfField();
    });

    anchor.addEventListener('input', () => {
        anchorPinned = true;
        anchorValue.textContent = `${anchor.value}%`;
        flyover?.setCamera({ anchor: currentAnchor() });
        applyDepthOfField();
    });

    const applyAim = () => flyover?.setCamera({ aim: currentAim() });
    const applyZoom = () => flyover?.setCamera({ zoom: currentZoom() });

    aimMode.addEventListener('change', () => {
        showModeFields();
        applyAim();
    });
    zoomMode.addEventListener('change', () => {
        showModeFields();
        applyZoom();
    });

    points.addEventListener('input', () => {
        pointsValue.textContent = points.value;
        applyAim();
    });

    distance.addEventListener('input', () => {
        distanceValue.textContent = `${distance.value} m`;
        applyAim();
    });

    instructions.addEventListener('input', () => {
        instructionsValue.textContent = instructions.value;
        applyZoom();
    });

    zoom.addEventListener('input', () => {
        zoomValue.textContent = zoom.value;
        applyZoom();
    });

    exaggeration.addEventListener('input', () => {
        exaggerationValue.textContent = exaggeration.value;
        setKnob(terrain, terrainKnobCatalogue, 'elevation.exaggeration', Number(exaggeration.value));
    });

    depthOfField.addEventListener('change', applyDepthOfField);

    hillshade.addEventListener('change', () => terrain.setHillshadeVisible(hillshade.checked));

    marker.addEventListener('change', () => flyover?.setMarker({ visible: marker.checked }));

    showModeFields();
    followPitchWithAnchor();
    initTogglePanel();
    await planRoute();
    // Flying on load is the demo. A visitor whose system asks for less motion lands on the paused
    // overview instead, and presses Fly the route.
    if (!matchMedia('(prefers-reduced-motion: reduce)').matches) togglePlay();
})();
