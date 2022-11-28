/**
 * Returns a display-friendly version of the given duration in seconds.
 * @param seconds The duration to format, given in seconds.
 */
export const formatDuration = (seconds: number | undefined): string | null => {
    if (seconds) {
        // get the absolute value for seconds to calculate the right formatting
        const absSeconds = Math.abs(seconds);
        const hours = absSeconds / 3600;
        let flooredHours = Math.floor(hours);
        let minutes = Math.round((hours % 1) * 60);
        if (minutes === 60) {
            minutes = 0;
            flooredHours++;
        }
        if (flooredHours) {
            return `${flooredHours} hr ${minutes.toString().padStart(2, "0")} min`;
        } else if (minutes) {
            return `${minutes.toString()} min`;
        }
    }
    return null;
};
