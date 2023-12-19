/**
 * Date and time, along with convenient derived properties.
 * @group Place
 * @category Types
 */
export type Moment = {
    date: Date;
    dateYYYYMMDD: string;
    year: number;
    month: number;
    day: number;
    hour: number;
    minute: number;
};

/**
 * Represents a range of time between two moments (start and end).
 * * Can be used to represent a time range for a day (e.g., 9:00-17:00) or between multiple days.
 * @group Place
 * @category Types
 */
export type TimeRange = {
    start: Moment;
    end: Moment;
};

/**
 * @group Place
 * @category Types
 */
export type OpeningHoursMode = "nextSevenDays";

/**
 * @group Place
 * @category Types
 */
export type OpeningHours = {
    mode: OpeningHoursMode;
    /**
     * The time ranges for the requested open hours period.
     */
    timeRanges: TimeRange[];
    /**
     * If true, the place is always open for the requested open hours period.
     */
    alwaysOpenThisPeriod: boolean;
};
