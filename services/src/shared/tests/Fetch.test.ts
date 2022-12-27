import MockAdapter from "axios-mock-adapter";
import axios from "axios";
import { get, post } from "../Fetch";

const axiosMock = new MockAdapter(axios);

describe("Get json test", () => {
    test("OK response", async () => {
        axiosMock.onGet().replyOnce(200, { id: "some json" });
        expect(await get(new URL("https://blah.com"))).toStrictEqual({ id: "some json" });
    });

    test("Failed response from rejected axios promise", async () => {
        axiosMock.onGet().replyOnce(410);
        await expect(get(new URL("https://blah.com"))).rejects.toHaveProperty("response.status", 410);
    });

    test("Failed response", async () => {
        axiosMock.onGet().timeout();
        await expect(get(new URL("https://blah.com"))).rejects.toMatchObject({
            config: {
                data: undefined
            },
            code: "ECONNABORTED"
        });
    });
});

describe("Post json test", () => {
    test("OK response", async () => {
        axiosMock.onPost().replyOnce(200, { id: "some json" });
        expect(await post({ url: new URL("https://blah.com") })).toStrictEqual({ id: "some json" });
    });

    test("Failed response from rejected axios promise", async () => {
        axiosMock.onPost().replyOnce(410);
        await expect(post({ url: new URL("https://blah.com") })).rejects.toHaveProperty("response.status", 410);
    });

    test("Failed response", async () => {
        axiosMock.onPost().timeout();
        await expect(post({ url: new URL("https://blah.com") })).rejects.toMatchObject({
            config: {
                data: undefined
            },
            code: "ECONNABORTED"
        });
    });
});
