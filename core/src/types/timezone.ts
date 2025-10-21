/**
 * Time zone information using IANA Time Zone Database identifiers.
 *
 * @remarks
 * IANA identifiers follow the format `Area/Location` (e.g., `America/New_York`, `Europe/London`).
 * These are standardized time zone identifiers maintained by the Internet Assigned Numbers Authority.
 *
 * @see [IANA Time Zone Database](https://www.iana.org/time-zones)
 *
 * @example
 * ```typescript
 * const timezone: TimeZone = {
 *   ianaId: 'Europe/Amsterdam'
 * };
 * ```
 *
 * @group Shared
 */
export type TimeZone = {
    /**
     * IANA Time Zone Database identifier.
     *
     * Examples: `America/New_York`, `Europe/London`, `Asia/Tokyo`
     */
    ianaId: string;
};
