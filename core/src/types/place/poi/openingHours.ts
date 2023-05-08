type Moment = {
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
    mode: string;
    timeRanges: TimeRange[];
};
