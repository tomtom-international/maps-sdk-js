import { fetchJson } from "../Fetch";
import MockAdapter from "axios-mock-adapter";
import axios from "axios";

describe("Fetch json test", () => {
    const axiosMock = new MockAdapter(axios);

    test("OK response", async () => {
        axiosMock.onGet().replyOnce(200, { id: "some json" });
        expect(await fetchJson(new URL("https://blah.com"))).toStrictEqual({ id: "some json" });
    });

    test("Failed response from resolved axios promise with error code", async () => {
        axiosMock.onGet().replyOnce(410);
        await expect(fetchJson(new URL("https://blah.com"))).rejects.toEqual(410);
    });

    test("Failed response from rejected axios promise", async () => {
        axiosMock.onGet().replyOnce(410);
        await expect(fetchJson(new URL("https://blah.com"))).rejects.toEqual(410);
    });
});
