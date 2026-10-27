import { TomTomConfig } from '@tomtom-org/maps-sdk/core';
import {
    getKnob,
    type KnobEntry,
    knobEntryOf,
    type StandardStyleID,
    StylingFoundationsModule,
    type StylingFoundationsModuleConfig,
    setKnob,
    standardStyleIDs,
    stylingFoundationsKnobCatalogue,
    TomTomMap,
} from '@tomtom-org/maps-sdk/map';
import { Buildings3D, GLSurfaces, type GLSurfacesConfig } from '@tomtom-org/maps-sdk-plugin-landmarks-3d';
import {
    buildings3DKnobCatalogue,
    type GLSurfacesKnobId,
    glSurfacesKnobCatalogue,
} from '@tomtom-org/maps-sdk-plugin-landmarks-3d/knobs';
import { effectKnobCatalogue, MapEffects } from '@tomtom-org/maps-sdk-plugin-map-effects';
import './style.css';
import { API_KEY } from './config';
import { type KnobControl, knobControl } from './knobControls';
import { initTogglePanel } from './togglePanel';

// (Set your own API key when working in your own environment)
TomTomConfig.instance.put({ apiKey: API_KEY, language: 'en-GB' });

type Place = { center: [number, number]; zoom: number; pitch: number; bearing: number };

// Each place shows off a few of the surfaces, seen low over the ground so the water mirrors the sky.
const places: Record<string, Place> = {
    'Lake Geneva': { center: [6.6323, 46.507], zoom: 14.5, pitch: 70, bearing: 160 },
    'Amsterdam canals': { center: [4.8897, 52.3702], zoom: 16.5, pitch: 55, bearing: 20 },
    'Veluwe forest': { center: [5.8065, 52.0875], zoom: 16.5, pitch: 65, bearing: 0 },
    'Vondelpark trees': { center: [4.8686, 52.3579], zoom: 17, pitch: 60, bearing: 60 },
    'Black Forest': { center: [8.1985, 48.0405], zoom: 16, pitch: 70, bearing: 200 },
    'Flevoland fields': { center: [5.55, 52.5], zoom: 13.5, pitch: 45, bearing: 30 },
    'Dune du Pilat': { center: [-1.2155, 44.5895], zoom: 14.5, pitch: 60, bearing: 270 },
    'Scheveningen beach': { center: [4.2665, 52.1095], zoom: 16, pitch: 65, bearing: 300 },
    'Central Park': { center: [-73.9665, 40.7812], zoom: 15.5, pitch: 55, bearing: 30 },
    'Aletsch Glacier': { center: [8.03, 46.5], zoom: 14.5, pitch: 55, bearing: 200 },
    'Ginkel heath': { center: [5.735, 52.03], zoom: 15.5, pitch: 55, bearing: 30 },
    'Biesbosch mud flats': { center: [4.8416, 51.7464], zoom: 15.5, pitch: 50, bearing: 0 },
    'Dam Square': { center: [4.8925, 52.373], zoom: 17.5, pitch: 55, bearing: 20 },
};

// The panel's sections, each a list of surfaces knobs with the label its control takes. A colour
// left unset shows the style's colour as the season shades it.
const sections: Record<string, [GLSurfacesKnobId, string][]> = {
    '#ui-surfaces': [
        ['visible', 'Textured surfaces'],
        ['surfaces.water.intensity', 'Water'],
        ['surfaces.ice.intensity', 'Ice'],
        ['surfaces.forest.intensity', 'Forest'],
        ['surfaces.grass.intensity', 'Grass'],
        ['surfaces.scrub.intensity', 'Scrub'],
        ['surfaces.farmland.intensity', 'Farmland'],
        ['surfaces.sand.intensity', 'Sand'],
        ['surfaces.mud.intensity', 'Mud'],
        ['surfaces.gravel.intensity', 'Shingle'],
        ['surfaces.rock.intensity', 'Rock'],
        ['surfaces.paving.intensity', 'Paving'],
        ['surfaces.urban.intensity', 'Built-up ground'],
        ['surfaces.roads.intensity', 'Roads'],
    ],
    '#ui-season': [['season', 'Season']],
    '#ui-water': [
        ['surfaces.water.season', 'Season'],
        ['surfaces.water.waves.heightFactor', 'Waves'],
        ['surfaces.water.enclosed.waves.heightFactor', 'Enclosed water ripples'],
        ['surfaces.water.shore.intensity', 'Shore'],
        ['surfaces.water.shore.reachMeters', 'Waves rolling in from (m)'],
        ['surfaces.water.reflection.intensity', 'Sky reflection'],
        ['surfaces.water.glint.intensity', 'Glint'],
    ],
    '#ui-water-colors': [
        ['surfaces.water.colors.shallow', 'Shallows'],
        ['surfaces.water.colors.foam', 'Foam'],
        ['surfaces.water.glint.color', 'Glint'],
    ],
    '#ui-forest': [
        ['surfaces.forest.season', 'Season'],
        ['surfaces.forest.crowns.sizeFactor', 'Crown size'],
        ['surfaces.forest.conifer.fraction', 'Conifers'],
    ],
    '#ui-forest-colors': [
        ['surfaces.forest.colors.broadleaf', 'Broadleaf'],
        ['surfaces.forest.colors.conifer', 'Conifer'],
    ],
    '#ui-grass': [
        ['surfaces.grass.season', 'Season'],
        ['surfaces.grass.mown.fraction', 'Mown lawns'],
        ['surfaces.grass.stripes.intensity', 'Mowing stripes'],
        ['surfaces.grass.flowers.fraction', 'Flowers'],
    ],
    '#ui-grass-colors': [
        ['surfaces.grass.colors.lush', 'Lush'],
        ['surfaces.grass.colors.dry', 'Dry'],
        ['surfaces.grass.colors.flowers', 'Flowers'],
    ],
    '#ui-farmland': [
        ['surfaces.farmland.season', 'Season'],
        ['surfaces.farmland.parcels.sizeFactor', 'Parcel size'],
        ['surfaces.farmland.rows.intensity', 'Rows'],
        ['surfaces.farmland.hedges.intensity', 'Hedges'],
    ],
    '#ui-farmland-colors': [
        ['surfaces.farmland.colors.young', 'Young crops'],
        ['surfaces.farmland.colors.cereal', 'Cereal'],
        ['surfaces.farmland.colors.soil', 'Soil'],
        ['surfaces.farmland.colors.pasture', 'Pasture'],
        ['surfaces.farmland.colors.rapeseed', 'Rapeseed'],
        ['surfaces.farmland.colors.stubble', 'Stubble'],
        ['surfaces.farmland.colors.hedges', 'Hedges'],
    ],
    '#ui-sand': [
        ['surfaces.sand.season', 'Season'],
        ['surfaces.sand.dunes.intensity', 'Dunes'],
        ['surfaces.sand.ripples.intensity', 'Ripples'],
        ['surfaces.sand.wet.widthMeters', 'Wet sand (m)'],
    ],
    '#ui-sand-colors': [['surfaces.sand.colors.wet', 'Wet sand']],
    '#ui-ice-scrub': [
        ['surfaces.ice.season', 'Ice season'],
        ['surfaces.ice.crevasses.intensity', 'Crevasses'],
        ['surfaces.scrub.season', 'Scrub season'],
        ['surfaces.scrub.bushes.intensity', 'Bushes'],
    ],
    '#ui-ice-scrub-colors': [
        ['surfaces.ice.colors.crevasses', 'Crevasses'],
        ['surfaces.scrub.colors.bushes', 'Bushes'],
    ],
    '#ui-mud-gravel': [
        ['surfaces.mud.season', 'Mud season'],
        ['surfaces.mud.puddles.intensity', 'Creeks and puddles'],
        ['surfaces.gravel.season', 'Shingle season'],
        ['surfaces.gravel.stones.intensity', 'Stones'],
    ],
    '#ui-mud-colors': [['surfaces.mud.colors.wet', 'Wet mud']],
    '#ui-rock-roads': [
        ['surfaces.rock.season', 'Rock season'],
        ['surfaces.rock.ridges.intensity', 'Rock ridges'],
        ['surfaces.paving.season', 'Paving season'],
        ['surfaces.paving.joints.intensity', 'Paving joints'],
        ['surfaces.urban.season', 'Built-up season'],
        ['surfaces.urban.wear.intensity', 'Built-up wear'],
        ['surfaces.roads.season', 'Road season'],
        ['surfaces.roads.wear.intensity', 'Road wear'],
    ],
    '#ui-paving-colors': [['surfaces.paving.colors.joints', 'Paving joints']],
    '#ui-trees': [
        ['trees.visible', '3D trees'],
        ['trees.season', 'Season'],
        ['trees.densityFactor', 'Tree density'],
        ['trees.sizeFactor', 'Tree size'],
        ['trees.species.broadleaf.shareFactor', 'Broadleaf trees'],
        ['trees.species.conifer.shareFactor', 'Conifers'],
        ['trees.species.columnar.shareFactor', 'Columnar trees'],
        ['trees.species.umbrella.shareFactor', 'Umbrella trees'],
        ['trees.species.bush.shareFactor', 'Bushes'],
        ['trees.minZoom', 'Trees from zoom'],
        ['trees.shadows.intensity', 'Tree shadows'],
        ['trees.tracks.intensity', 'Paths through the woods'],
    ],
    '#ui-trees-colors': [
        ['trees.colors.broadleaf', 'Broadleaf'],
        ['trees.colors.conifer', 'Conifer'],
    ],
    '#ui-colors': [
        ['sky.color', 'Sky'],
        ['sky.horizonColor', 'Horizon'],
    ],
    '#ui-wind': [
        ['wind.direction', 'Wind from (°)'],
        ['wind.speedFactor', 'Wind speed'],
    ],
};

// The map's foundation colours, which every surface's season derives its colours from.
const foundationColors = [
    ['colors.land', 'Land'],
    ['colors.water', 'Water'],
    ['colors.vegetation', 'Vegetation'],
    ['colors.park', 'Parks'],
] as const;

// An effect knob's label from its id: `depthOfField.focusDistance` reads "Focus distance".
const labelOf = (id: string): string => {
    const words = id.slice(id.indexOf('.') + 1).replace(/[A-Z.]/g, (letter) => ` ${letter.replace('.', '')}`);
    return words.charAt(0).toUpperCase() + words.slice(1).toLowerCase();
};

// One light for the whole map, fixed to the compass so it stays put as the map turns. The textured
// surfaces and the 3D buildings both follow it, so the tree crowns and the shadows agree.
const initialStyling = {
    view: { light: { direction: 215, altitude: 30, alignment: 'map' } },
} satisfies StylingFoundationsModuleConfig;

(async () => {
    const map = new TomTomMap({ mapLibre: { container: 'sdk-map', ...places['Lake Geneva'] } });

    // The waves and the grass hold still for readers who ask for less motion.
    const initialConfig: GLSurfacesConfig = matchMedia('(prefers-reduced-motion: reduce)').matches
        ? { wind: { speedFactor: 0 } }
        : {};
    const surfaces = new GLSurfaces(map, initialConfig);
    // The 3D buildings under the same sun, casting their shadows on the trees.
    const buildings = new Buildings3D(map);
    // The effects the map-effects plugin composites over the whole map, all off until a slider moves.
    const effects = new MapEffects(map);
    const styling = await StylingFoundationsModule.get(map, initialStyling);
    // getKnob reports the value each knob resolves to, the map's own sky and light while unset, so
    // the controls always show what the map draws.
    // A season, a foundation colour or the style changes the colours derived from it, so every
    // control shows its value again once the map has taken the change: on `styledata` for what
    // restyles the map, and on input for the seasons, which reach the surfaces' uniforms alone. Any
    // other knob changes only its own, which its control already shows: each getKnob resolves the
    // plugin's whole look.
    const shownValues: (() => void)[] = [];
    let showFrame = 0;
    const showValues = () => {
        showFrame = 0;
        for (const show of shownValues) show();
    };
    const showValuesSoon = () => {
        if (!showFrame) showFrame = requestAnimationFrame(showValues);
    };
    const addControl = (
        parent: string | HTMLElement,
        knob: KnobEntry<string>,
        label: string,
        read: () => unknown,
        apply: (value: never) => void,
        derivesColors = false,
    ) => {
        const control: KnobControl = knobControl(knob, label, (value) => {
            apply(value as never);
            if (derivesColors) showValuesSoon();
        });
        shownValues.push(() => control.show(read() as Parameters<KnobControl['show']>[0]));
        (typeof parent === 'string' ? (document.querySelector(parent) as HTMLElement) : parent).append(control.element);
    };

    for (const [selector, knobs] of Object.entries(sections)) {
        for (const [id, label] of knobs) {
            addControl(
                selector,
                knobEntryOf(glSurfacesKnobCatalogue, id),
                label,
                () => getKnob(surfaces, glSurfacesKnobCatalogue, id),
                (value) => setKnob(surfaces, glSurfacesKnobCatalogue, id, value),
                id === 'season' || id.endsWith('.season'),
            );
        }
    }
    for (const [id, label] of foundationColors) {
        addControl(
            '#ui-foundation-colors',
            knobEntryOf(stylingFoundationsKnobCatalogue, id),
            label,
            () => getKnob(styling, stylingFoundationsKnobCatalogue, id),
            (value) => setKnob(styling, stylingFoundationsKnobCatalogue, id, value),
        );
    }
    addControl(
        '#ui-light',
        knobEntryOf(buildings3DKnobCatalogue, 'visible'),
        '3D buildings',
        () => buildings.isVisible(),
        (visible) => buildings.setVisible(visible),
    );
    for (const [id, label] of [
        ['view.light.direction', 'Light direction (°)'],
        ['view.light.altitude', 'Light altitude (°)'],
    ] as const) {
        addControl(
            '#ui-light',
            knobEntryOf(stylingFoundationsKnobCatalogue, id),
            label,
            () => getKnob(styling, stylingFoundationsKnobCatalogue, id),
            (value) => setKnob(styling, stylingFoundationsKnobCatalogue, id, value),
        );
    }
    // One collapsible section per effect, its controls from the catalogue.
    const effectSections = new Map<string, HTMLElement>();
    for (const knob of effectKnobCatalogue) {
        const effect = knob.id.slice(0, knob.id.indexOf('.'));
        let section = effectSections.get(effect);
        if (!section) {
            const disclosure = document.createElement('details');
            disclosure.className = 'ui-disclosure';
            disclosure.innerHTML = `<summary class="ui-disclosure-summary ui-form-label" title="${knob.useCase}">${labelOf(`.${effect}`)}</summary><div class="ui-disclosure-content"></div>`;
            (document.querySelector('#ui-effects') as HTMLElement).append(disclosure);
            section = disclosure.querySelector('.ui-disclosure-content') as HTMLElement;
            effectSections.set(effect, section);
        }
        addControl(
            section,
            knob,
            labelOf(knob.id),
            () => getKnob(effects, effectKnobCatalogue, knob.id),
            (value) => setKnob(effects, effectKnobCatalogue, knob.id, value),
        );
    }
    map.mapLibreMap.once('idle', showValues);
    map.mapLibreMap.on('styledata', showValuesSoon);

    const placeSelector = document.querySelector('#ui-place') as HTMLSelectElement;
    Object.keys(places).forEach((name) => placeSelector.add(new Option(name)));
    placeSelector.addEventListener('change', () => map.mapLibreMap.jumpTo(places[placeSelector.value]));

    // The surfaces come back after a style switch, in the new style's colours and, while unset, its sky.
    const styleSelector = document.querySelector('#ui-mapStyle') as HTMLSelectElement;
    standardStyleIDs.forEach((styleId) => styleSelector.add(new Option(styleId)));
    styleSelector.addEventListener('change', async () => {
        await map.setStyle(styleSelector.value as StandardStyleID);
        showValues();
    });

    document.querySelector('#ui-reset')?.addEventListener('click', () => {
        surfaces.applyConfig(initialConfig);
        buildings.setVisible(true);
        effects.resetConfig();
        styling.applyConfig(initialStyling);
        showValues();
    });

    initTogglePanel();
})();
