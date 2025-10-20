/**
 * Generic object type with string keys and unknown values.
 *
 * Used as a flexible type constraint for objects where the shape is not predetermined.
 * Useful for extensible property objects or when accepting arbitrary user data.
 *
 * @example
 * ```typescript
 * function processCustomData(data: Anything) {
 *   // Access properties dynamically
 *   console.log(data['customField']);
 * }
 * ```
 *
 * @group Shared
 * @category Types
 */
export type Anything = { [x: string]: unknown };
