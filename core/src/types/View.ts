/**
 * @group Shared
 * @category Types
 */
export const views = ["Unified", "AR", "IN", "PK", "IL", "MA", "RU", "TR", "CN"] as const;
/**
 * @group Shared
 * @category Types
 */
export type View = (typeof views)[number];
