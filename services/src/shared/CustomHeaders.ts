import axios from "axios";
import { generateTomTomCustomHeaders } from "core";
import { CommonServiceParams } from "./ServiceTypes";

export const injectCustomHeaders = (params: CommonServiceParams): void => {
    const tomtomHeaders = generateTomTomCustomHeaders(params);

    // Injecting custom headers to axios
    axios.defaults.headers.common = {
        ...tomtomHeaders
    };
};
