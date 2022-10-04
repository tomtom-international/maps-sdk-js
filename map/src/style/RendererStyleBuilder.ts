import template from "lodash/template";
import { MapInitParams, PublishedStyle, PublishedStyleID } from "../types/MapInit";

const publishedStyleURLTemplates: Record<PublishedStyleID, string> = {
    standardLight:
        "${baseURL}/style/1/style/${version}/?key=${apiKey}" +
        "&map=2/basic_street-light&traffic_flow=2/flow_relative-light" +
        "&traffic_incidents=2/incidents_light&poi=2/poi_dynamic-light",
    standardDark:
        "${baseURL}/style/1/style/${version}/?key=${apiKey}" +
        "&map=2/basic_street-dark&traffic_flow=2/flow_relative-dark" +
        "&traffic_incidents=2/incidents_dark&poi=2/poi_dynamic-dark",
    drivingLight:
        "${baseURL}/style/1/style/${version}/?key=${apiKey}" +
        "&map=2/basic_street-light-driving&traffic_flow=2/flow_relative-light" +
        "&traffic_incidents=2/incidents_light&poi=2/poi_dynamic-light",
    drivingDark:
        "${baseURL}/style/1/style/${version}/?key=${apiKey}" +
        "&map=2/basic_street-dark-driving&traffic_flow=2/flow_relative-dark" +
        "&traffic_incidents=2/incidents_dark&poi=2/poi_dynamic-dark",
    monoLight:
        "${baseURL}/style/1/style/${version}/?key=${apiKey}" +
        "&map=2/basic_mono-light&traffic_flow=2/flow_relative-light" +
        "&traffic_incidents=2/incidents_light&poi=2/poi_dynamic-mono-light",
    satellite:
        "${baseURL}/style/1/style/${version}/?key=${apiKey}" +
        "&map=2/basic_street-satellite&traffic_incidents=2/incidents_light" +
        "&traffic_flow=2/flow_relative-light&poi=2/poi_dynamic-satellite"
};

const buildPublishedStyleURL = (publishedStyle: PublishedStyle, baseURL: string, apiKey: string): string =>
    template(publishedStyleURLTemplates[publishedStyle.id])({
        baseURL,
        version: publishedStyle.version || "22.3.*",
        apiKey
    });

const withAPIKey = (givenURL: string, apiKey: string): string => {
    const url = new URL(givenURL);
    url.searchParams.set("key", apiKey);
    return url.toString();
};

/**
 * @ignore
 * @param mapParams The SDK parameters to convert to input renderer style.
 * @return The map style to load into the renderer.
 */
export const buildRendererStyle = (mapParams: MapInitParams): string | Record<string, unknown> => {
    const style = mapParams.style;
    const baseURL = mapParams.commonBaseURL as string;
    const apiKey = mapParams.apiKey as string;
    if (typeof style === "string") {
        return buildPublishedStyleURL({ id: style }, baseURL, apiKey);
    } else if (style?.published) {
        return buildPublishedStyleURL(style.published, baseURL, apiKey);
    } else if (style?.custom?.url) {
        return withAPIKey(style.custom.url, apiKey);
    } else if (style?.custom?.json) {
        return style?.custom.json;
    } else {
        return buildPublishedStyleURL({ id: "standardLight" }, baseURL, apiKey);
    }
};
