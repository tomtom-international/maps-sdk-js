/**
 * @ignore
 */
export const changingWhileNotInTheStyle = (whatToChange: string): string =>
    `Trying to change ${whatToChange} while it is not in the map style. Did you exclude it when loading the map?`;
