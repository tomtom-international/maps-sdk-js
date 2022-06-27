export const setupFetchMock = () => {
    const fetchMock = jest.fn();

    beforeAll(() => {
        global.fetch = fetchMock;
    });

    afterEach(() => {
        jest.resetAllMocks();
    });

    return fetchMock;
};
