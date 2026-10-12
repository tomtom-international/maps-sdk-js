import { useEffect } from 'react';
import type { MapModules } from './useMapModules';

/** Rings the section or leg of the shown routes with the given id on the map, or none. */
export const useSectionFocus = (modules: MapModules | undefined, sectionId?: string) => {
    useEffect(() => {
        void modules?.routing.setSectionFocus(sectionId ? [sectionId] : null);
    }, [modules, sectionId]);
};
