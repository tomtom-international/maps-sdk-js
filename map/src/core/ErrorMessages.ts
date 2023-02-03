/**
 * @ignore
 */
export const notInTheStyle = (actionText: string): Error =>
    new Error(`Trying to ${actionText} while it is not in the map style. Did you exclude it when loading the map?`);
