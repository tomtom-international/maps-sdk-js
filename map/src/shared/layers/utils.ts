/**
 * Returns a text with a number suffixed after a hyphen.
 * @ignore
 */
export const suffixNumber = (text: string, numberToSuffix: number): string => `${text}-${numberToSuffix}`;

/**
 * Returns the id a layer is added under, which carries its module instance's prefix when there is
 * one.
 * @ignore
 */
export const prefixLayerID = (layerName: string, layerIDPrefix?: string): string =>
    layerIDPrefix ? `${layerIDPrefix}-${layerName}` : layerName;
