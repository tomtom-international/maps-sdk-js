import type { ExpressionFilterSpecification, ExpressionSpecification, FilterSpecification } from 'maplibre-gl';
import type { FilterShowMode, ValuesFilter } from './types';

// Recognizes MapLibre's expression filter syntax, so that a style's own filter can be
// converted before the SDK merges its filters into it. Ported from MapLibre's
// `isExpressionFilter`, which the style spec keeps internal.
const isExpressionFilter = (filter: FilterSpecification): filter is ExpressionFilterSpecification => {
    if (filter === true || filter === false) {
        return true;
    }

    if (!Array.isArray(filter) || filter.length === 0) {
        return false;
    }
    switch (filter[0]) {
        case 'has':
            return filter.length >= 2 && filter[1] !== '$id' && filter[1] !== '$type';

        case 'in':
            return filter.length >= 3 && (typeof filter[1] !== 'string' || Array.isArray(filter[2]));

        case '!in':
        case '!has':
        case 'none':
            return false;

        case '==':
        case '!=':
        case '>':
        case '>=':
        case '<':
        case '<=':
            return filter.length !== 3 || Array.isArray(filter[1]) || Array.isArray(filter[2]);

        case 'any':
        case 'all':
            for (const filterItem of filter.slice(1)) {
                if (!isExpressionFilter(filterItem as FilterSpecification) && typeof filterItem !== 'boolean') {
                    return false;
                }
            }
            return true;

        default:
            return true;
    }
};

type LegacyValue = string | number | boolean | null;

// A legacy filter names a feature property directly. An expression reads it with `get`,
// except for the two reserved keys: `$type` is the geometry type and `$id` the feature id.
const propertyAccessor = (property: string): ExpressionSpecification => {
    if (property === '$type') {
        return ['geometry-type'];
    }
    if (property === '$id') {
        return ['id'];
    }

    return ['get', property];
};

// Neither reserved key is a property, so neither can be looked up with `has`: every feature
// has a geometry type, and a feature id needs its own presence test.
const convertHas = (property: string): ExpressionFilterSpecification => {
    if (property === '$type') {
        return true;
    }
    if (property === '$id') {
        return ['!=', ['id'], null];
    }

    return ['has', property];
};

// An ordering comparison evaluates to null, and logs a runtime type error on every feature,
// when the property is absent or holds another type. The legacy filter was simply false
// there, so the comparison is guarded by the type the style compares against.
const convertOrdering = (
    operator: '>' | '>=' | '<' | '<=',
    property: string,
    value: LegacyValue,
): ExpressionFilterSpecification => [
    'all',
    ['==', ['typeof', propertyAccessor(property)], typeof value],
    [operator, propertyAccessor(property), value] as ExpressionSpecification,
];

// `get` yields null for a property that is absent as well as one that holds null, but a legacy
// comparison against null only matched a property that was actually present. `$id` has no such
// ambiguity, so it compares directly.
const convertNullComparison = (operator: '==' | '!=', property: string): ExpressionFilterSpecification | undefined => {
    if (property === '$id' || property === '$type') {
        return undefined;
    }
    if (operator === '==') {
        return ['all', ['has', property], ['==', ['get', property], null]];
    }

    return ['any', ['!', ['has', property]], ['!=', ['get', property], null]];
};

const convertIn = (property: string, values: LegacyValue[]): ExpressionFilterSpecification => {
    if (!values.length) {
        return false;
    }

    return ['in', propertyAccessor(property), ['literal', values]];
};

// Converts one legacy filter node. The node is read as a plain array because the legacy and
// expression tuple unions overlap, which stops TypeScript from narrowing on the operator.
// A combining node counts as legacy as soon as one of its children is, so its other children can
// reach here already expressed, and one of them can be a boolean rather than a node at all. Each
// child therefore goes back through `toExpressionFilter` instead of straight into this function.
const convertLegacyFilter = (filter: readonly unknown[]): ExpressionFilterSpecification => {
    const operator = filter[0];
    // MapLibre treats a legacy filter without arguments as a constant.
    if (filter.length <= 1) {
        return operator !== 'any';
    }

    const property = filter[1] as string;
    const values = filter.slice(2) as LegacyValue[];
    const subFilters = filter.slice(1) as readonly FilterSpecification[];

    switch (operator) {
        case 'has':
            return convertHas(property);
        case '!has':
            return ['!', convertHas(property)];
        case '==':
        case '!=':
            return (
                (values[0] === null ? convertNullComparison(operator, property) : undefined) ??
                ([operator, propertyAccessor(property), values[0]] as ExpressionSpecification)
            );
        case '>':
        case '>=':
        case '<':
        case '<=':
            return convertOrdering(operator, property, values[0]);
        case 'in':
            return convertIn(property, values);
        case '!in':
            return ['!', convertIn(property, values)];
        case 'all':
            return ['all', ...subFilters.map((subFilter) => toExpressionFilter(subFilter))];
        case 'any':
            return ['any', ...subFilters.map((subFilter) => toExpressionFilter(subFilter))];
        case 'none':
            return ['!', ['any', ...subFilters.map((subFilter) => toExpressionFilter(subFilter))]];
        default:
            return true;
    }
};

/**
 * Converts a filter to MapLibre's expression syntax, leaving one that already uses it untouched.
 *
 * MapLibre does not support a filter that mixes the deprecated syntax with the expression syntax,
 * so a style layer's own filter has to be converted before an SDK filter is merged into it. What
 * such a mix costs depends on where the deprecated node sits: `featureFilter` converts a filter
 * whose root is deprecated node by node, but one whose root is an expression only earns a
 * deprecation warning, and then fails to compile when the deprecated node reaches
 * `createExpression`.
 *
 * A filter that mixes the two therefore has to be converted branch by branch, which is what
 * MapLibre's own converter does, so this one recurses through here rather than through
 * `convertLegacyFilter`.
 *
 * @ignore
 */
export const toExpressionFilter = (filter: FilterSpecification): ExpressionFilterSpecification =>
    isExpressionFilter(filter) ? filter : convertLegacyFilter(filter as readonly unknown[]);

/**
 * @ignore
 */
export const getMergedAnyFilter = (filters: ExpressionFilterSpecification[]): ExpressionFilterSpecification | null => {
    if (!filters?.length) {
        return null;
    }
    if (filters.length === 1) {
        return filters[0];
    }

    return ['any', ...filters] as ExpressionSpecification;
};

/**
 * @ignore
 */
export const buildMappedValuesFilter = <T>(
    propertyName: string,
    showMode: FilterShowMode,
    values: T[],
): ExpressionFilterSpecification => {
    if (values.length === 1) {
        const comparator = showMode === 'only' ? '==' : '!=';
        return [comparator, ['get', propertyName], values[0]] as ExpressionSpecification;
    }

    const membership = ['in', ['get', propertyName], ['literal', values]] as ExpressionSpecification;
    return showMode === 'only' ? membership : ['!', membership];
};

/**
 * @ignore
 */
export const buildValuesFilter = <T>(
    propertyName: string,
    filter: ValuesFilter<T>,
    valuesMapping?: (value: T) => unknown,
): ExpressionFilterSpecification =>
    buildMappedValuesFilter(
        propertyName,
        filter.show,
        valuesMapping ? filter.values.map(valuesMapping) : filter.values,
    );
