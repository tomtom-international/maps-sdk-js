/**
 * Simple verification if an object is empty
 * @ignore
 * @param value
 */
export const isEmpty = (value: any) => !value || !Object.keys(value).length;
