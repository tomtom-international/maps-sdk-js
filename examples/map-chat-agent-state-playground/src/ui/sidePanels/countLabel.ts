/** `1 place`, `3 places`: for a unit whose plural only adds an `s`. */
export const countLabel = (count: number, unit: string): string => `${count} ${unit}${count === 1 ? '' : 's'}`;
