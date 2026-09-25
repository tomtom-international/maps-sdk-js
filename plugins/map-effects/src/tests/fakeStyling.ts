import type { StylingModule } from '@tomtom-org/maps-sdk/map';

// A styling module that reports the colours a style paints its knobs in, which is all a bloom scope reads.
export const stylingWith = (colors: Record<string, string | undefined>): StylingModule =>
    ({ get: (id: string) => colors[id] }) as unknown as StylingModule;
