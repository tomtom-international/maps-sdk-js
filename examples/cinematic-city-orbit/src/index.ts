import { TomTomConfig } from '@tomtom-org/maps-sdk/core';
import {
    BaseMapModule,
    getKnob,
    POIsModule,
    type StandardStyleID,
    StylingFoundationsModule,
    setKnob,
    TomTomMap,
} from '@tomtom-org/maps-sdk/map';
import { Buildings3D, Landmarks3D } from '@tomtom-org/maps-sdk-plugin-landmarks-3d';
import { type EffectKnobId, effectKnobCatalogue, MapEffects } from '@tomtom-org/maps-sdk-plugin-map-effects';
import { deriveMapColors } from '@tomtom-org/maps-sdk-plugin-map-theme';
import './style.css';
import { aimAtGround } from './aimAtGround';
import { API_KEY } from './config';
import { type CityLook, cityLooks } from './looks';
import { initTogglePanel } from './togglePanel';

// (Set your own API key when working in your own environment)
TomTomConfig.instance.put({ apiKey: API_KEY, language: 'en-GB' });

// The Empire State Building, 443 m to its tip, among the towers of Midtown Manhattan.
const LANDMARK_CENTER: [number, number] = [-73.9857, 40.7484];
const LANDMARK_HEIGHT_METERS = 443;
const ORBIT_DEGREES_PER_SECOND = 4;
// Aims at the landmark's middle rather than its foot, so the orbit turns around the whole tower.
const ORBIT_CAMERA = { center: LANDMARK_CENTER, elevation: LANDMARK_HEIGHT_METERS / 2, zoom: 16, pitch: 60 };

const sliderLabels: Partial<Record<EffectKnobId, string>> = {
    'bloom.intensity': 'Bloom',
    'glare.intensity': 'Glare',
    'depthOfField.intensity': 'Depth of field (px)',
};

(async () => {
    const [firstLook] = cityLooks;
    let currentStyle: StandardStyleID = firstLook.style;
    const map = new TomTomMap({
        style: currentStyle,
        mapLibre: {
            container: 'sdk-map',
            ...ORBIT_CAMERA,
            // Without it, MapLibre keeps the camera aimed at the ground.
            centerClampedToGround: false,
            bearing: -20,
        },
    });
    const styling = await StylingFoundationsModule.get(map);
    // A skyline rather than a street map: the city's names stay, its street names and POIs go.
    await BaseMapModule.get(map, {
        groups: { roadLabels: { visible: false }, roadShields: { visible: false }, houseNumbers: { visible: false } },
    });
    await POIsModule.get(map, { visible: false });

    // The landmark models, and the base map's buildings around them with windows, light and shadows.
    const landmarks = new Landmarks3D(map);
    const buildings = new Buildings3D(map);
    const effects = new MapEffects(map);

    // Each slider takes its range from the effect's catalogue entry, and shows where a look left the effect.
    const sliderShows: (() => void)[] = [];
    for (const knob of effectKnobCatalogue) {
        const label = sliderLabels[knob.id];
        if (knob.kind !== 'number' || !label) continue;

        const { min, max, step } = knob.range;
        const field = document.createElement('label');
        field.className = 'ui-form-field';
        field.innerHTML = `<span class="ui-form-label">${label}</span>
            <div class="ui-slider-container"><input type="range" class="ui-slider" min="${min}" max="${max}" step="${step}"><span class="ui-slider-value"></span></div>`;
        const input = field.querySelector('input') as HTMLInputElement;
        const readout = field.querySelector('.ui-slider-value') as HTMLElement;
        input.addEventListener('input', () => {
            readout.textContent = input.value;
            setKnob(effects, effectKnobCatalogue, knob.id, Number(input.value));
        });
        document.querySelector('#ui-effects')?.append(field);
        sliderShows.push(() => {
            input.value = String(getKnob(effects, effectKnobCatalogue, knob.id));
            readout.textContent = input.value;
        });
    }

    let selectedLook = firstLook;
    const applyLook = async (look: CityLook) => {
        selectedLook = look;
        // Each plugin takes the look's whole config: what a look leaves out goes back to its default.
        buildings.applyConfig(look.buildings);
        landmarks.applyConfig(look.landmarks);
        effects.applyConfig(look.effects);
        sliderShows.forEach((show) => show());

        if (look.style !== currentStyle) {
            currentStyle = look.style;
            await map.setStyle(look.style);
        }
        // A quicker pick has replaced this look while its style loaded.
        if (selectedLook !== look) return;

        // The map's ten colours, derived from a handful by the map-theme plugin. Walls a look leaves
        // unset follow the built-up colour among them.
        styling.applyConfig({ colors: deriveMapColors(look.theme.colors, { mode: look.theme.mode }) });
    };

    const looksContainer = document.querySelector('#ui-looks') as HTMLElement;
    for (const look of cityLooks) {
        const card = document.createElement('label');
        card.className = 'ui-option-card';
        const swatches = look.theme.colors.map((color) => `<span style="background: ${color}"></span>`).join('');
        card.innerHTML = `<input type="radio" name="look"><span class="ui-look-label">${look.label}</span><span class="ui-swatches">${swatches}</span>`;
        const radio = card.querySelector('input') as HTMLInputElement;
        radio.checked = look === firstLook;
        radio.addEventListener('change', () => applyLook(look));
        looksContainer.append(card);
    }
    await applyLook(firstLook);

    const orbitToggle = document.querySelector('#ui-orbit') as HTMLInputElement;
    let orbitFrame = 0;
    const orbitFrom = (previous: number) => (now: number) => {
        const { mapLibreMap } = map;
        mapLibreMap.setBearing(mapLibreMap.getBearing() + ((now - previous) / 1000) * ORBIT_DEGREES_PER_SECOND);
        orbitFrame = requestAnimationFrame(orbitFrom(now));
    };
    const setOrbiting = (orbiting: boolean) => {
        orbitToggle.checked = orbiting;
        cancelAnimationFrame(orbitFrame);
        if (!orbiting) return;

        map.mapLibreMap.jumpTo(ORBIT_CAMERA);
        orbitFrame = requestAnimationFrame(orbitFrom(performance.now()));
    };
    orbitToggle.addEventListener('change', () => setOrbiting(orbitToggle.checked));
    // Grabbing, scrolling or a key on the map hands the camera to the reader, aimed at the ground. It has to
    // happen on the DOM event, before the map's own handlers see it: each orbit step and the new aim are
    // camera jumps, and a jump cancels a map gesture under way.
    for (const type of ['pointerdown', 'wheel', 'keydown']) {
        map.mapLibreMap.getContainer().addEventListener(
            type,
            () => {
                setOrbiting(false);
                aimAtGround(map.mapLibreMap);
            },
            { capture: true },
        );
    }
    setOrbiting(!matchMedia('(prefers-reduced-motion: reduce)').matches);

    initTogglePanel();
})();
