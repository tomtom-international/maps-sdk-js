/** A record's keys, typed as its keys: `Object.keys` widens them to `string`. */
export const keysOf = <Key extends string>(record: Record<Key, unknown>) => Object.keys(record) as Key[];
