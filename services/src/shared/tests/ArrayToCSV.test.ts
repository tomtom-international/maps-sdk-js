import { arrayToCSV } from "../Arrays";

describe("Array to CSV tests", () => {
    test("Array to CSV test", async () => {
        expect(arrayToCSV(null as unknown as string)).toStrictEqual("");
        expect(arrayToCSV("123")).toStrictEqual("123");
        expect(arrayToCSV(["123"])).toStrictEqual("123");
        expect(arrayToCSV(["123", "456"])).toStrictEqual("123,456");
        expect(arrayToCSV(["hello", "there"])).toStrictEqual("hello,there");
        expect(arrayToCSV(["hello", "there", 3 as unknown as string])).toStrictEqual("hello,there,3");
        expect(arrayToCSV(3)).toStrictEqual("3");
        expect(arrayToCSV([123])).toStrictEqual("123");
        expect(arrayToCSV([50.12312, -43.01231])).toStrictEqual("50.12312,-43.01231");
    });
});
