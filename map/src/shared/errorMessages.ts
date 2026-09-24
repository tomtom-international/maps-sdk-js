import type { StyleModule } from '../init';

/**
 * @ignore
 */
export const notInTheStyle = (actionText: string): Error =>
    new Error(`Trying to ${actionText} while it is not in the map style. Did you exclude it when loading the map?`);

/**
 * @ignore
 */
export const customStyleWithoutSource = (): Error =>
    new Error(
        "A custom map style takes exactly one of 'url' or 'json', and this one carries neither. " +
            'Give the URL the style is served from, or the style specification itself.',
    );

/**
 * @ignore
 */
export const cannotAddStyleModuleToCustomStyle = (styleModule: StyleModule): Error =>
    new Error(
        `The custom map style has no '${styleModule}' part and the SDK cannot add one to it. ` +
            'Style-owned modules work on a custom style only when it already ships the matching source ' +
            '(e.g. built with Map Maker with that part enabled) — or switch to a standard style.',
    );
