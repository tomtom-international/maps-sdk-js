import isEmpty from "lodash/isEmpty";
import { StyleSpecification } from "maplibre-gl";
import { PublishedStyle, PublishedStyleID, StyleInput, StyleModule, TomTomMapParams } from "./types/mapInit";

const DEFAULT_PUBLISHED_STYLE = "standardLight";
const URL_PREFIX = "${baseURL}/style/1/style/${version}/?key=${apiKey}";

const publishedStyleModulesValues: Record<PublishedStyleID, Record<StyleModule, string>> = {
    standardLight: {
        traffic_incidents: "2/incidents_light",
        traffic_flow: "2/flow_relative-light",
        poi: "2/poi_dynamic-light",
        hillshade: "2-test/hillshade_rgb-light"
    },
    standardDark: {
        traffic_incidents: "2/incidents_dark",
        traffic_flow: "2/flow_relative-dark",
        poi: "2/poi_dynamic-dark",
        hillshade: "2-test/hillshade_rgb-dark"
    },
    drivingLight: {
        traffic_incidents: "2/incidents_light",
        traffic_flow: "2/flow_relative-light",
        poi: "2/poi_dynamic-light",
        hillshade: "2-test/hillshade_rgb-light"
    },
    drivingDark: {
        traffic_incidents: "2/incidents_dark",
        traffic_flow: "2/flow_relative-dark",
        poi: "2/poi_dynamic-dark",
        hillshade: "2-test/hillshade_rgb-dark"
    },
    monoLight: {
        traffic_incidents: "2/incidents_light",
        traffic_flow: "2/flow_relative-light",
        poi: "2/poi_dynamic-mono-light",
        hillshade: "2-test/hillshade_rgb-mono-light"
    },
    monoDark: {
        traffic_incidents: "2/incidents_dark",
        traffic_flow: "2/flow_relative-dark",
        poi: "2/poi_dynamic-mono-dark",
        hillshade: "2-test/hillshade_rgb-mono-dark"
    },
    satellite: {
        traffic_incidents: "2/incidents_light",
        traffic_flow: "2/flow_relative-light",
        poi: "2/poi_dynamic-satellite",
        hillshade: "2-test/hillshade_rgb-satellite"
    }
};
const publishedStyleURLTemplates: Record<PublishedStyleID, string> = {
    standardLight: URL_PREFIX + "&map=2/basic_street-light",
    standardDark: URL_PREFIX + "&map=2/basic_street-dark",
    drivingLight: URL_PREFIX + "&map=2/basic_street-light-driving",
    drivingDark: URL_PREFIX + "&map=2/basic_street-dark-driving",
    monoLight: URL_PREFIX + "&map=2/basic_mono-light",
    monoDark: URL_PREFIX + "&map=2/basic_mono-dark",
    satellite: URL_PREFIX + "&map=2/basic_street-satellite"
};

const buildPublishedStyleURL = (publishedStyle: PublishedStyle, baseURL: string, apiKey: string): string =>
    publishedStyleURLTemplates[publishedStyle?.id ?? DEFAULT_PUBLISHED_STYLE]
        .replace("${baseURL}", baseURL)
        .replace("${version}", publishedStyle.version || "24.2.*")
        .replace("${apiKey}", apiKey);

const withAPIKey = (givenURL: string, apiKey: string): string => {
    const url = new URL(givenURL);
    if (!url.searchParams.has("key")) {
        url.searchParams.set("key", apiKey);
    } else {
        console.warn(
            "The style URL is coming with an API key parameter which takes priority. " +
                "If you want to use the SDK configured API key, remove the key param from the style URL"
        );
    }
    return url.toString();
};

/**
 * @ignore
 * @param url The SDK parameters to convert to input renderer style.
 * @param publishedStyle style with included style modules to show in the style url.
 * @return The map style to load into the renderer.
 */
const includeModulesOptions = (url: string, publishedStyle: PublishedStyle): string => {
    const styleUrl = new URL(url);

    if (publishedStyle.include?.length) {
        publishedStyle.include.forEach((module) =>
            styleUrl.searchParams.append(
                module,
                publishedStyleModulesValues[publishedStyle?.id ?? DEFAULT_PUBLISHED_STYLE][module]
            )
        );
    }

    return decodeURIComponent(styleUrl.toString());
};

/**
 * @ignore
 * @param mapParams The SDK parameters to convert to input renderer style.
 * @return The map style to load into the renderer.
 */
export const buildStyleInput = (mapParams: TomTomMapParams): StyleSpecification | string => {
    let mapStyleUrl: StyleSpecification | string;
    let isIncludeEmpty = true;
    const style = mapParams.style;
    const baseURL = mapParams.commonBaseURL;
    const apiKey = mapParams.apiKey;

    if (typeof style === "string") {
        mapStyleUrl = buildPublishedStyleURL({ id: style }, baseURL, apiKey);
    } else if (style?.type === "published") {
        mapStyleUrl = buildPublishedStyleURL(style, baseURL, apiKey);
        isIncludeEmpty = isEmpty(style.include);
    } else if (style?.type === "custom" && style?.url) {
        mapStyleUrl = withAPIKey(style.url, apiKey);
    } else if (style?.type === "custom" && style?.json) {
        mapStyleUrl = style.json;
    } else {
        mapStyleUrl = buildPublishedStyleURL({ id: DEFAULT_PUBLISHED_STYLE }, baseURL, apiKey);
    }

    return isIncludeEmpty ? mapStyleUrl : includeModulesOptions(mapStyleUrl as string, style as PublishedStyle);
};

/**
 * Includes the previous published style parts into the given published style if the new one didn't define any.
 * * Both new and previous styles must be of "published" type.
 * @ignore
 */
export const withPreviousStyleParts = (style: StyleInput, previousStyle?: StyleInput): StyleInput => {
    if (
        previousStyle &&
        typeof previousStyle == "object" &&
        previousStyle.type == "published" &&
        previousStyle.include
    ) {
        if (typeof style == "string" || (style.type == "published" && !style.include)) {
            return {
                type: "published",
                id: typeof style == "string" ? style : style.id,
                include: previousStyle.include
            };
        }
    }
    return style;
};
