import { fetchJson } from "../Fetch";
import mockAxios from "jest-mock-axios";

describe("Fetch json test", () => {
    test("OK response", async () => {
        mockAxios.get.mockResolvedValueOnce({ status: 200, data: { id: "some json" } });
        expect(await fetchJson(new URL("https://blah.com"))).toStrictEqual({ id: "some json" });
    });

    test("Failed response from resolved axios promise with error code", async () => {
        mockAxios.get.mockResolvedValueOnce({ status: 410 });
        await expect(fetchJson(new URL("https://blah.com"))).rejects.toEqual(410);
    });

    test("Failed response from rejected axios promise", async () => {
        mockAxios.get.mockRejectedValueOnce({ response: { status: 410 } });
        await expect(fetchJson(new URL("https://blah.com"))).rejects.toEqual(410);
    });
});
