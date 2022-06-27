import { fetchJson } from "../Fetch";
import { setupFetchMock } from "./FetchMockUtils";

describe("Fetch json test", () => {
    const fetchMock = setupFetchMock();

    test("OK response", async () => {
        fetchMock.mockImplementationOnce(() =>
            Promise.resolve({ ok: true, json: () => Promise.resolve({ id: "some json" }) })
        );
        expect(await fetchJson<any>("test")).toStrictEqual({ id: "some json" });
    });

    test("Failed response", async () => {
        fetchMock.mockImplementationOnce(() => Promise.resolve({ status: 410 }));
        await expect(async () => {
            await fetchJson<any>("test");
        }).rejects.toEqual(410);
    });
});
