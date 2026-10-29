import type { StandardStyleID, StylingFoundationsModule, TomTomMap } from '@tomtom-org/maps-sdk/map';
import type { Buildings3D, GLSurfaces, Landmarks3D } from '@tomtom-org/maps-sdk-plugin-landmarks-3d';
import type { MapEffects } from '@tomtom-org/maps-sdk-plugin-map-effects';
import { deriveMapColors } from '@tomtom-org/maps-sdk-plugin-map-theme';
import type { Flyby } from './flybys';
import { skyOf } from './sky';
import { type FlybyTheme, flybyThemes } from './themes';

type Looks = {
    map: TomTomMap;
    styling: StylingFoundationsModule;
    buildings: Buildings3D;
    landmarks: Landmarks3D;
    effects: MapEffects;
    surfaces: GLSurfaces;
    /** Whether the surfaces toggle, and this look, want the textured ground on. */
    surfacesShowFor: (theme: FlybyTheme) => boolean;
    /** The place on screen now. A look applies its trees from the place, not from the look alone. */
    flyby: () => Flyby;
    themeSelect: HTMLSelectElement;
    /** Reduced motion holds the waves and the trees still. */
    reducedMotion: boolean;
};

// One task at a time: a style still loading cannot paint over the look picked since.
const serial = () => {
    let tail: Promise<void> = Promise.resolve();
    return (task: () => Promise<void>): Promise<void> => {
        const run = tail.then(task, task);
        tail = run.then(
            () => undefined,
            () => undefined,
        );
        return run;
    };
};

/** Applies a look at once, and keeps style switches in the order they were picked. */
export const createLooks = ({
    map,
    styling,
    buildings,
    landmarks,
    effects,
    surfaces,
    surfacesShowFor,
    flyby,
    themeSelect,
    reducedMotion,
}: Looks) => {
    let selectedTheme: FlybyTheme | undefined;
    let currentStyle: StandardStyleID = flybyThemes[0].style;
    const enqueue = serial();

    const applySurfaces = (theme: FlybyTheme) => {
        surfaces.applyConfig({
            ...theme.surfaces,
            // The trees grow over the landscapes alone: from the rooftops a city's parks are a few pixels each,
            // and the frame goes to the buildings.
            trees: { ...theme.surfaces?.trees, visible: flyby().group === 'Landscapes' },
            visible: surfacesShowFor(theme),
            ...(reducedMotion && { wind: { speedFactor: 0 } }),
        });
    };

    const applyTheme = (theme: FlybyTheme, placed?: () => void): Promise<void> => {
        const previous = selectedTheme;
        if (previous?.pass && previous !== theme) effects.removePass(previous.pass.id);
        selectedTheme = theme;

        return enqueue(async () => {
            if (selectedTheme !== theme) return;

            // Each plugin takes the theme's whole config: what a theme leaves out goes back to its default.
            // Street names lie flat on the ground, so they hide behind the buildings in front.
            buildings.applyConfig({ ...theme.buildings, roadLabels: { occluded: true } });
            applySurfaces(theme);
            landmarks.applyConfig(theme.landmarks);
            effects.applyConfig(theme.effects);
            if (theme.pass) effects.addPass(theme.pass);

            if (theme.style !== currentStyle) {
                currentStyle = theme.style;
                await map.setStyle(theme.style);
                if (selectedTheme !== theme) return;
            }

            const colors = deriveMapColors(theme.theme.colors, { mode: theme.theme.mode });
            // One sun on the map lights the buildings, the landmarks and the ground, so the trees stand in the
            // buildings' shadows. It stays put as the camera turns.
            styling.applyConfig({
                colors,
                view: { sky: skyOf(theme, colors), light: { ...theme.sun, alignment: 'map' } },
                labels: { customTypeface: theme.font },
            });
            placed?.();
        });
    };

    // Each place opens in the look that shows it best, which the reader can change until the next place.
    const applyLookOf = (next: Flyby, placed?: () => void) => {
        const look = flybyThemes.find(({ label }) => label === next.look) ?? flybyThemes[0];
        themeSelect.value = String(flybyThemes.indexOf(look));
        return applyTheme(look, placed);
    };

    const syncSurfaces = () => {
        if (selectedTheme) surfaces.setVisible(surfacesShowFor(selectedTheme));
    };

    return { applyTheme, applyLookOf, syncSurfaces };
};
