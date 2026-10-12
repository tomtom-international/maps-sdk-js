import type {
    GeometriesModule,
    PlacesModule,
    RoutingModule,
    StylingFoundationsModule,
    StylingFoundationsModuleConfig,
} from '@tomtom-org/maps-sdk/map';
import { type TypefaceChoice, typefaceChoices, typefaceSelect } from './typefaces';

type Labels = NonNullable<StylingFoundationsModuleConfig['labels']>;

type TypefacePanelModules = {
    styling: StylingFoundationsModule;
    routing: RoutingModule;
    places: PlacesModule;
    area: GeometriesModule;
};

const SAME_AS_THE_MAP = 'Same as the map';

// The choice the map's labels are set in: their font files, else their Noto typeface, `sans` unless set.
const mapChoiceOf = (labels: Labels | undefined): string | undefined =>
    [...typefaceChoices].find(([, choice]) =>
        'customTypeface' in choice
            ? JSON.stringify(choice.customTypeface) === JSON.stringify(labels?.customTypeface)
            : !labels?.customTypeface && choice.typeface === (labels?.typeface ?? 'sans'),
    )?.[0];

/**
 * The typeface of every label on the map, and of the waypoints', places' and area's own, which
 * follow the map's until given one. Returns what puts them all back in the style's own.
 */
export const initTypefacePanel = ({ styling, routing, places, area }: TypefacePanelModules): (() => void) => {
    // The other label settings (size) stay; a choice replaces the typeface of either kind.
    const setMapTypeface = (choice: TypefaceChoice | undefined) => {
        const { typeface, customTypeface, ...labels } = styling.getConfig()?.labels ?? {};
        styling.updateConfig({ labels: { ...labels, ...choice } });
    };
    const mapSelect = typefaceSelect('ui-mapTypeface', mapChoiceOf(styling.getConfig()?.labels) ?? '');
    mapSelect.addEventListener('change', () => setMapTypeface(typefaceChoices.get(mapSelect.value)));
    // A preset or a reset sets the typeface knob too.
    styling.events.on('config-change', (config) => {
        mapSelect.value = mapChoiceOf(config?.labels) ?? '';
    });

    const moduleSelects = [
        ['ui-waypointTypeface', (choice) => routing.updateConfig({ waypoints: { label: choice } })],
        ['ui-placeTypeface', (choice) => places.updateConfig({ label: choice })],
        // An area draws its title inside and its name along the border.
        ['ui-areaTypeface', (choice) => area.updateConfig({ label: choice, lineLabel: choice ?? {} })],
    ] as const satisfies [string, (choice: TypefaceChoice | undefined) => void][];
    const selects = moduleSelects.map(([id, apply]) => {
        const select = typefaceSelect(id, '', SAME_AS_THE_MAP);
        select.addEventListener('change', () => apply(typefaceChoices.get(select.value)));
        return { select, apply };
    });

    return () => {
        setMapTypeface(undefined);
        for (const { select, apply } of selects) {
            select.value = '';
            apply(undefined);
        }
    };
};
