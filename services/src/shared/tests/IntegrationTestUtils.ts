import { GOSDKConfig } from "@anw/go-sdk-js/core";

export const putIntegrationTestsAPIKey = () => {
    GOSDKConfig.instance.put({
        apiKey: process.env.API_KEY_TESTS,
    });
};
