/**
 * @group Shared
 * @category Types
 */
export const views = ["Unified", "AR", "IN", "PK", "IL", "MA", "RU", "TR", "CN"] as const;
export type View = typeof views[number];
