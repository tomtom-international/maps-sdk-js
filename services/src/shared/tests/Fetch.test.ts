import MockAdapter from "axios-mock-adapter";
import axios from "axios";
import { fetchWith, get, post } from "../Fetch";

const axiosMock = new MockAdapter(axios);

describe("Fetch utility tests", () => {
    describe("Get tests", () => {
        test("OK response", async () => {
            axiosMock.onGet().replyOnce(200, { id: "some json" });
            expect(await get(new URL("https://blah.com"))).toStrictEqual({ id: "some json" });
        });

        test("Failed response from rejected axios promise", async () => {
            axiosMock.onGet().replyOnce(410);
            await expect(get(new URL("https://blah.com"))).rejects.toHaveProperty("response.status", 410);
        });

        test("Failed response", async () => {
            axiosMock.onGet().timeoutOnce();
            await expect(get(new URL("https://blah.com"))).rejects.toMatchObject({
                config: {
                    data: undefined
                },
                code: "ECONNABORTED"
            });
        });
    });

    describe("Post tests", () => {
        test("OK response", async () => {
            axiosMock.onPost().replyOnce(200, { id: "some json" });
            expect(await post({ url: new URL("https://blah.com") })).toStrictEqual({ id: "some json" });
        });

        test("Failed response from rejected axios promise", async () => {
            axiosMock.onPost().replyOnce(410);
            await expect(post({ url: new URL("https://blah.com") })).rejects.toHaveProperty("response.status", 410);
        });

        test("Failed response", async () => {
            axiosMock.onPost().timeoutOnce();
            await expect(post({ url: new URL("https://blah.com") })).rejects.toMatchObject({
                config: {
                    data: undefined
                },
                code: "ECONNABORTED"
            });
        });
    });

    describe("Fetch-with tests", () => {
        test("OK GET response", async () => {
            axiosMock.onGet().replyOnce(200, { id: "some json" });
            expect(await fetchWith({ method: "GET", url: new URL("https://blah.com") })).toStrictEqual({
                id: "some json"
            });
        });

        test("OK POST response", async () => {
            axiosMock.onPost().replyOnce(200, { id: "some json" });
            expect(await fetchWith({ method: "POST", url: new URL("https://blah.com") })).toStrictEqual({
                id: "some json"
            });
        });

        test("Failed POST response from rejected axios promise", async () => {
            axiosMock.onPost().replyOnce(410);
            await expect(fetchWith({ method: "POST", url: new URL("https://blah.com") })).rejects.toHaveProperty(
                "response.status",
                410
            );
        });

        test("Incorrect HTTP method", async () => {
            await expect(
                fetchWith({ method: "UNSUPPORTED" as never, url: new URL("https://blah.com") })
            ).rejects.toHaveProperty("message", "Unsupported HTTP method received: UNSUPPORTED");
        });
    });
});
