import type { ExpressionFilterSpecification, LegacyFilterSpecification } from 'maplibre-gl';

/**
 * @ignore
 */
export type FilterSyntaxVersion = 'expression' | 'legacy';

/**
 * @ignore
 */
export type MultiSyntaxFilter = {
    /**
     * Filter expression following the new expression syntax.
     */
    expression: ExpressionFilterSpecification;
    /**
     * Filter expression following the legacy syntax.
     */
    legacy: LegacyFilterSpecification;
};
