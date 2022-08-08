import { CommonServiceParams } from "./ServiceTypes";

export const appendCommonParams = (urlParams: URLSearchParams, params: CommonServiceParams): void => {
    urlParams.append("key", params.apiKey as string);
    params.language && urlParams.append("language", params.language);
};
