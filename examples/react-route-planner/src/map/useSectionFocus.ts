import { useEffect } from 'react';
import type { MapModules } from './useMapModules';

/** Rings the sections or legs of the shown routes with the given ids on the map, or none. */
export const useSectionFocus = (modules: MapModules | undefined, sectionIds: readonly string[] = []) => {
    // Section ids hold no spaces, and a list built on every render rings the same sections as long as it names them.
    const key = sectionIds.join(' ');
    useEffect(() => {
        void modules?.routing.setSectionFocus(key ? key.split(' ') : null);
    }, [modules, key]);
};
