import MockAdapter from "axios-mock-adapter";
import axios from "axios";
import { getJson, postJson } from "../Fetch";

const axiosMock = new MockAdapter(axios);

describe("Get json test", () => {
    test("OK response", async () => {
        axiosMock.onGet().replyOnce(200, { id: "some json" });
        expect(await getJson(new URL("https://blah.com"))).toStrictEqual({ id: "some json" });
    });

    test("Failed response from rejected axios promise", async () => {
        axiosMock.onGet().replyOnce(410);
        await expect(getJson(new URL("https://blah.com"))).rejects.toEqual(410);
    });

    test("Failed response", async () => {
        axiosMock.onGet().timeout();
        await expect(getJson(new URL("https://blah.com"))).rejects.toEqual(undefined);
    });
});

describe("Post json test", () => {
    test("OK response", async () => {
        axiosMock.onPost().replyOnce(200, { id: "some json" });
        expect(await postJson({ url: new URL("https://blah.com") })).toStrictEqual({ id: "some json" });
    });

    test("Failed response from rejected axios promise", async () => {
        axiosMock.onPost().replyOnce(410);
        await expect(postJson({ url: new URL("https://blah.com") })).rejects.toEqual(410);
    });

    test("Failed response", async () => {
        axiosMock.onPost().timeout();
        await expect(postJson({ url: new URL("https://blah.com") })).rejects.toEqual(undefined);
    });
});
