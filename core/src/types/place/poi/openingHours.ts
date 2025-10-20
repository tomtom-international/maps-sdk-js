/**
 * Date and time with convenient derived properties.
 *
 * Represents a specific moment in time with pre-calculated components
 * for easy access without additional date parsing.
 *
 * @example
 * ```typescript
 * const moment: Moment = {
 *   date: new Date('2025-10-20T09:30:00Z'),
 *   dateYYYYMMDD: '2025-10-20',
 *   year: 2025,
 *   month: 10,
 *   day: 20,
 *   hour: 9,
 *   minute: 30
 * };
 * ```
 *
 * @group Place
 * @category Types
 */
export type Moment = {
    /**
     * JavaScript Date object representing this moment.
     */
    date: Date;
    /**
     * Date formatted as YYYY-MM-DD string.
     *
     * Useful for display or comparison without time components.
     */
    dateYYYYMMDD: string;
    /**
     * Four-digit year (e.g., 2025).
     */
    year: number;
    /**
     * Month number (1-12).
     *
     * Note: Unlike JavaScript Date.getMonth(), this is 1-based (January = 1).
     */
    month: number;
    /**
     * Day of month (1-31).
     */
    day: number;
    /**
     * Hour in 24-hour format (0-23).
     */
    hour: number;
    /**
     * Minute (0-59).
     */
    minute: number;
};

/**
 * Time range with start and end moments.
 *
 * Represents a period when a POI is open. Can span multiple days
 * (e.g., opening late one day and closing early the next).
 *
 * @remarks
 * - For same-day hours: start and end are on the same date
 * - For overnight hours: end date is after start date (e.g., open until 2 AM)
 *
 * @example
 * ```typescript
 * // Monday 9:00 AM to 5:00 PM
 * const timeRange: TimeRange = {
 *   start: { date: new Date('2025-10-20T09:00:00'), hour: 9, minute: 0, ... },
 *   end: { date: new Date('2025-10-20T17:00:00'), hour: 17, minute: 0, ... }
 * };
 *
 * // Friday 10 PM to Saturday 2 AM (overnight)
 * const overnight: TimeRange = {
 *   start: { date: new Date('2025-10-24T22:00:00'), hour: 22, ... },
 *   end: { date: new Date('2025-10-25T02:00:00'), hour: 2, ... }
 * };
 * ```
 *
 * @group Place
 * @category Types
 */
export type TimeRange = {
    /**
     * Opening time for this period.
     */
    start: Moment;
    /**
     * Closing time for this period.
     */
    end: Moment;
};

/**
 * Operating hours mode specifying the time period covered.
 *
 * Currently only 'nextSevenDays' is supported, providing operating hours
 * for the upcoming week.
 *
 * @group Place
 * @category Types
 */
export type OpeningHoursMode = 'nextSevenDays';

/**
 * Operating hours information for a POI.
 *
 * Describes when a location is open for business, including:
 * - Regular daily schedules
 * - Split shifts (e.g., lunch break closures)
 * - Overnight hours
 * - 24/7 operation
 *
 * @remarks
 * Use this to:
 * - Display "Open now" / "Closed" status
 * - Show upcoming hours
 * - Determine if a location is open at a specific time
 * - Plan visits during operating hours
 *
 * @example
 * ```typescript
 * const openingHours: OpeningHours = {
 *   mode: 'nextSevenDays',
 *   timeRanges: [
 *     { start: {...}, end: {...} },  // Monday
 *     { start: {...}, end: {...} }   // Tuesday
 *   ],
 *   alwaysOpenThisPeriod: false
 * };
 *
 * // 24/7 location
 * const alwaysOpen: OpeningHours = {
 *   mode: 'nextSevenDays',
 *   timeRanges: [],
 *   alwaysOpenThisPeriod: true
 * };
 * ```
 *
 * @group Place
 * @category Types
 */
export type OpeningHours = {
    /**
     * Time period mode for the provided hours.
     *
     * Currently always 'nextSevenDays'.
     */
    mode: OpeningHoursMode;
    /**
     * Array of time ranges when the POI is open.
     *
     * Each time range represents one opening period. Multiple ranges per day
     * indicate split shifts (e.g., closed for lunch).
     *
     * Empty array if alwaysOpenThisPeriod is true.
     */
    timeRanges: TimeRange[];
    /**
     * Indicates if the POI is always open during the requested period.
     *
     * When true, the location operates 24/7 and timeRanges will be empty.
     * When false, refer to timeRanges for specific open hours.
     */
    alwaysOpenThisPeriod: boolean;
};
