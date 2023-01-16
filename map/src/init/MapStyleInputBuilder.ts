import isEmpty from "lodash/isEmpty";
import { StyleSpecification } from "maplibre-gl";
import { GOSDKMapParams, PublishedStyle, PublishedStyleID, StyleModules } from "./types/MapInit";

export const TRAFFIC_INCIDENTS = "traffic_incidents";
export const TRAFFIC_FLOW = "traffic_flow";
export const POI = "poi";
export const HILLSHADE = "hillshade";

const publishedStyleURLTemplates: Record<PublishedStyleID, string> = {
    standardLight:
        "${baseURL}/style/1/style/${version}/?key=${apiKey}" +
        "&map=2/basic_street-light" +
        `&${TRAFFIC_FLOW}=2/flow_relative-light` +
        `&${TRAFFIC_INCIDENTS}=2/incidents_light` +
        `&${POI}=2/poi_dynamic-light` +
        `&${HILLSHADE}=2-test/hillshade_rgb-light`,
    standardDark:
        "${baseURL}/style/1/style/${version}/?key=${apiKey}" +
        "&map=2/basic_street-dark" +
        `&${TRAFFIC_FLOW}=2/flow_relative-dark` +
        `&${TRAFFIC_INCIDENTS}=2/incidents_dark` +
        `&${POI}=2/poi_dynamic-dark` +
        `&${HILLSHADE}=2-test/hillshade_rgb-dark`,
    drivingLight:
        "${baseURL}/style/1/style/${version}/?key=${apiKey}" +
        "&map=2/basic_street-light-driving" +
        `&${TRAFFIC_FLOW}=2/flow_relative-light` +
        `&${TRAFFIC_INCIDENTS}=2/incidents_light` +
        `&${POI}=2/poi_dynamic-light` +
        `&${HILLSHADE}=2-test/hillshade_rgb-light`,
    drivingDark:
        "${baseURL}/style/1/style/${version}/?key=${apiKey}" +
        "&map=2/basic_street-dark-driving" +
        `&${TRAFFIC_FLOW}=2/flow_relative-dark` +
        `&${TRAFFIC_INCIDENTS}=2/incidents_dark` +
        `&${POI}=2/poi_dynamic-dark` +
        `&${HILLSHADE}=2-test/hillshade_rgb-dark`,
    monoLight:
        "${baseURL}/style/1/style/${version}/?key=${apiKey}" +
        "&map=2/basic_mono-light" +
        `&${TRAFFIC_FLOW}=2/flow_relative-light` +
        `&${TRAFFIC_INCIDENTS}=2/incidents_light` +
        `&${POI}=2/poi_dynamic-mono-light` +
        `&${HILLSHADE}=2-test/hillshade_rgb-mono-light`,
    satellite:
        "${baseURL}/style/1/style/${version}/?key=${apiKey}" +
        "&map=2/basic_street-satellite" +
        `&${TRAFFIC_INCIDENTS}=2/incidents_light` +
        `&${TRAFFIC_FLOW}=2/flow_relative-light` +
        `&${POI}=2/poi_dynamic-satellite` +
        `&${HILLSHADE}=2-test/hillshade_rgb-satellite`
};

const buildPublishedStyleURL = (publishedStyle: PublishedStyle, baseURL: string, apiKey: string): string =>
    publishedStyleURLTemplates[publishedStyle.id]
        .replace("${baseURL}", baseURL)
        .replace("${version}", publishedStyle.version || "24.0.*")
        .replace("${apiKey}", apiKey);

const withAPIKey = (givenURL: string, apiKey: string): string => {
    const url = new URL(givenURL);
    url.searchParams.set("key", apiKey);
    return url.toString();
};

/**
 * @ignore
 * @param url The SDK parameters to convert to input renderer style.
 * @param modules Object with the properties to hide in the style url.
 * @return The map style to load into the renderer.
 */
export const excludeModulesOptions = (url: string, modules: StyleModules[] | undefined): string => {
    const styleUrl = new URL(url);

    if (modules?.length) {
        modules.includes(TRAFFIC_FLOW) && styleUrl.searchParams.delete(TRAFFIC_FLOW);
        modules.includes(TRAFFIC_INCIDENTS) && styleUrl.searchParams.delete(TRAFFIC_INCIDENTS);
        modules.includes(POI) && styleUrl.searchParams.delete(POI);
        modules.includes(HILLSHADE) && styleUrl.searchParams.delete(HILLSHADE);
    }

    return decodeURIComponent(styleUrl.toString());
};

/**
 * @ignore
 * @param mapParams The SDK parameters to convert to input renderer style.
 * @return The map style to load into the renderer.
 */
export const buildMapStyleInput = (mapParams: GOSDKMapParams): StyleSpecification | string => {
    let mapStyleUrl: StyleSpecification | string;
    const style = mapParams.style;
    const baseURL = mapParams.commonBaseURL as string;
    const apiKey = mapParams.apiKey as string;
    const isExcludeEmpty = isEmpty(mapParams.exclude);

    if (typeof style === "string") {
        mapStyleUrl = buildPublishedStyleURL({ id: style }, baseURL, apiKey);
    } else if (style?.published) {
        mapStyleUrl = buildPublishedStyleURL(style.published, baseURL, apiKey);
    } else if (style?.custom?.url) {
        mapStyleUrl = withAPIKey(style.custom.url, apiKey);
    } else if (style?.custom?.json) {
        mapStyleUrl = style?.custom.json;
    } else {
        mapStyleUrl = buildPublishedStyleURL({ id: "standardLight" }, baseURL, apiKey);
    }

    return isExcludeEmpty ? mapStyleUrl : excludeModulesOptions(mapStyleUrl as string, mapParams.exclude);
};
