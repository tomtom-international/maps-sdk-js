/**
 * List of available views for geopolitical context.
 * @group Shared
 * @category Types
 */
export const views = ['Unified', 'AR', 'IN', 'PK', 'IL', 'MA', 'RU', 'TR', 'CN'] as const;

/**
 * Geopolitical View type. The context used to resolve the handling of disputed territories.
 * @group Shared
 * @category Types
 */
export type View = (typeof views)[number];
