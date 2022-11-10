/**
 * @ignore
 * @param input
 */
export const arrayToCSV = (input: unknown | unknown[]): string =>
    !input ? "" : Array.isArray(input) ? input.join(",") : typeof input == "string" ? input : String(input);

/**
 * Samples, if necessary, the given array to fit within the given max length.
 * * If the array already fits within maxLength, the same array is returned.
 * * The sampling is done by spreading the array points at a constant increment.
 * * The first and last points are always included if array and max lengths are > 1.
 * * The sampling is done with speed in mind, so it's not guaranteed to always fit maxLength. Very often it will be shorter.
 *
 * Use this when needing to quickly simplify an array to fit some max length without caring too much on the lost detail.
 * * If both the array and max length are long enough, the loss of detail won't likely be an issue.
 * @ignore
 */
export const sampleWithinMaxLength = <T>(array: T[], maxLength: number): T[] => {
    const length = array.length;
    if (length <= maxLength) {
        return array;
    }

    const sampledArray = [];
    let i;
    const increment = Math.ceil(length / maxLength);
    for (i = 0; i < length; i += increment) {
        sampledArray.push(array[i]);
    }
    // ensuring the last point is always added:
    if (maxLength > 1 && i >= length - increment) {
        if (sampledArray.length < maxLength) {
            sampledArray.push(array[length - 1]);
        } else {
            sampledArray[sampledArray.length - 1] = array[length - 1];
        }
    }

    return sampledArray;
};
