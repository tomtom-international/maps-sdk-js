import { arrayToCSV, sampleWithinMaxLength } from '../arrays';

describe('Array utility tests', () => {
    test('Array to CSV test', () => {
        expect(arrayToCSV(null as unknown as string)).toStrictEqual('');
        expect(arrayToCSV('123')).toStrictEqual('123');
        expect(arrayToCSV(['123'])).toStrictEqual('123');
        expect(arrayToCSV(['123', '456'])).toStrictEqual('123,456');
        expect(arrayToCSV(['hello', 'there'])).toStrictEqual('hello,there');
        expect(arrayToCSV(['hello', 'there', 3])).toStrictEqual('hello,there,3');
        expect(arrayToCSV([3, 'hello', 'there'])).toStrictEqual('3,hello,there');
        expect(arrayToCSV(3)).toStrictEqual('3');
        expect(arrayToCSV([123])).toStrictEqual('123');
        expect(arrayToCSV([50.12312, -43.01231])).toStrictEqual('50.12312,-43.01231');
    });

    test('Sample array to max length', () => {
        expect(sampleWithinMaxLength([10], 1)).toStrictEqual([10]);
        expect(sampleWithinMaxLength([10], 10)).toStrictEqual([10]);
        expect(sampleWithinMaxLength([10, 20], 1)).toStrictEqual([10]);
        expect(sampleWithinMaxLength([10, 20, 30, 40], 5)).toStrictEqual([10, 20, 30, 40]);
        expect(sampleWithinMaxLength(['a', 'b', 30, 40], 3)).toStrictEqual(['a', 30, 40]);
        expect(sampleWithinMaxLength([0, 1, 2, 3, 4, 5, 6, 7, 8, 9], 10)).toStrictEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
        // ensuring the last element is always added:
        expect(sampleWithinMaxLength([0, 1, 2, 3, 4, 5, 6, 7, 8, 9], 5)).toStrictEqual([0, 2, 4, 6, 9]);
        // acceptable smaller size than maxLength returned:
        expect(sampleWithinMaxLength([0, 1, 2, 3, 4, 5, 6, 7, 8, 9], 8)).toStrictEqual([0, 2, 4, 6, 8, 9]);
    });
});
