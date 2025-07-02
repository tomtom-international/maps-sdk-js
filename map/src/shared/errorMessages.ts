import type { StyleModule } from '../init';

/**
 * @ignore
 */
export const notInTheStyle = (actionText: string): Error =>
    new Error(`Trying to ${actionText} while it is not in the map style. Did you exclude it when loading the map?`);

/**
 * @ignore
 */
export const cannotAddStyleModuleToCustomStyle = (styleModule: StyleModule): Error =>
    new Error(`Trying to add style module ${styleModule} to the custom style!`);
