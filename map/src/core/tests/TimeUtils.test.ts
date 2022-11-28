import { formatDuration } from "../TimeUtils";

describe("Time utility tests", () => {
    test("format duration", () => {
        expect(formatDuration(0)).toBeNull();
        expect(formatDuration(20)).toBeNull();
        expect(formatDuration(30)).toBe("1 min");
        expect(formatDuration(60)).toBe("1 min");
        expect(formatDuration(100)).toBe("2 min");
        expect(formatDuration(3600)).toBe("1 hr 00 min");
        expect(formatDuration(3599)).toBe("1 hr 00 min");
        expect(formatDuration(3540)).toBe("59 min");
        expect(formatDuration(3570)).toBe("1 hr 00 min");
        expect(formatDuration(3660)).toBe("1 hr 01 min");
        expect(formatDuration(36120)).toBe("10 hr 02 min");
    });
});
