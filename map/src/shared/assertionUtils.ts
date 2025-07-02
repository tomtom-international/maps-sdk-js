import isNil from 'lodash/isNil';

/**
 * Throws an error if the given value is not defined.
 * @ignore
 */
export function assertDefined<T>(value: T | null | undefined): asserts value is T {
    if (isNil(value)) {
        throw new Error(`${value} must not be null/undefined. Something went wrong with its initialization.`);
    }
}

/**
 * Returns the given value as its defined type, or throws an error if it isn't defined.
 * @ignore
 * @throws
 */
export const asDefined = <T>(value: T | null | undefined): T => {
    assertDefined(value);
    return value;
};
