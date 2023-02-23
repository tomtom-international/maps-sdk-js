import MockAdapter from "axios-mock-adapter";
import axios from "axios";
import { GOSDKConfig } from "@anw/go-sdk-js/core";
import { fetchWith, get, post } from "../Fetch";
import { geocode } from "../../geocode";
import { search } from "../../search";

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

    describe("Tracking-ID header", () => {
        test("Set tracking-ID header per service", async () => {
            axiosMock.onGet().replyOnce(200, { summary: {}, results: [] });
            await geocode({ query: "teakhout", trackingId: "geocode-id" });
            expect(axios.defaults.headers.common["Tracking-ID"]).toEqual("geocode-id");
        });

        test("Default Tracking-ID as uuid", async () => {
            axiosMock.onGet().replyOnce(200, { summary: {}, results: [] });
            await geocode({ query: "teakhout" });
            // This only checked if the header has a uuid v4 format, not check for a valid UUID v4.
            const trackingId = axios.defaults.headers.common["Tracking-ID"]
                ?.toString()
                .match("^.{8}-.{4}-.{4}-.{4}-.{12}");
            expect(trackingId).toBeTruthy();
        });

        test("Set global and per service trackingId header", async () => {
            GOSDKConfig.instance.put({
                trackingId: "global-id"
            });
            axiosMock.onGet().reply(200, { summary: {}, results: [] });
            axiosMock.onPost().reply(200, { summary: {}, results: [] });

            await geocode({ query: "teakhout", trackingId: "geocode-id" });
            expect(axios.defaults.headers.common["Tracking-ID"]).toEqual("geocode-id");

            await search({ query: "cafe", geometries: [] });
            expect(axios.defaults.headers.common["Tracking-ID"]).toEqual("global-id");
        });
    });
});
