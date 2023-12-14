type Moment = {
    // TODO: add proper date: Date
    date: string;
    hour: number;
    minute: number;
};

type TimeRange = {
    startTime: Moment;
    endTime: Moment;
};

/**
 * @group Place
 * @category Types
 */
export type OpeningHours = {
    // TODO: type mode
    mode: string;
    timeRanges: TimeRange[];
    // TODO: calculate convenient variables like 24/7, open now, etc.
};
