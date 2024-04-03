import isEmpty from "lodash/isEmpty";
import type { StyleSpecification } from "maplibre-gl";
import type { PublishedStyle, PublishedStyleID, StyleInput, StyleModule, TomTomMapParams } from "./types/mapInit";

const DEFAULT_PUBLISHED_STYLE = "standardLight";
const URL_PREFIX = "${baseURL}/maps/orbis/assets/styles/${version}/style.json?&apiVersion=1&key=${apiKey}";

const publishedStyleModulesValues: Record<PublishedStyleID, Record<StyleModule, string>> = {
    standardLight: {
        trafficIncidents: "incidents_light",
        trafficFlow: "flow_relative-light",
        hillshade: "hillshade_light"
    },
    standardDark: {
        trafficIncidents: "incidents_dark",
        trafficFlow: "flow_relative-dark",
        hillshade: "hillshade_dark"
    },
    drivingLight: {
        trafficIncidents: "incidents_light",
        trafficFlow: "flow_relative-light",
        hillshade: "hillshade_light"
    },
    drivingDark: {
        trafficIncidents: "incidents_dark",
        trafficFlow: "flow_relative-dark",
        hillshade: "hillshade_dark"
    },
    monoLight: {
        trafficIncidents: "incidents_light",
        trafficFlow: "flow_relative-light",
        hillshade: "hillshade_mono-light"
    },
    monoDark: {
        trafficIncidents: "incidents_dark",
        trafficFlow: "flow_relative-dark",
        hillshade: "hillshade_mono-dark"
    },
    satellite: {
        trafficIncidents: "incidents_light",
        trafficFlow: "flow_relative-light",
        hillshade: "hillshade_satellite"
    }
};

const baseMapStyleURLTemplate = (suffix: string): string => `${URL_PREFIX}&map=${suffix}`;

const baseMapStyleURLTemplates: Record<PublishedStyleID, string> = {
    standardLight: baseMapStyleURLTemplate("basic_street-light"),
    standardDark: baseMapStyleURLTemplate("basic_street-dark"),
    drivingLight: baseMapStyleURLTemplate("basic_street-light-driving"),
    drivingDark: baseMapStyleURLTemplate("basic_street-dark-driving"),
    monoLight: baseMapStyleURLTemplate("basic_mono-light"),
    monoDark: baseMapStyleURLTemplate("basic_mono-dark"),
    satellite: baseMapStyleURLTemplate("basic_street-satellite")
};

const buildBaseMapStyleURL = (publishedStyle: PublishedStyle, baseURL: string, apiKey: string): string =>
    baseMapStyleURLTemplates[publishedStyle?.id ?? DEFAULT_PUBLISHED_STYLE]
        .replace("${baseURL}", baseURL)
        .replace("${version}", publishedStyle.version || "0.*")
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
        mapStyleUrl = buildBaseMapStyleURL({ id: style }, baseURL, apiKey);
    } else if (style?.type === "published") {
        mapStyleUrl = buildBaseMapStyleURL(style, baseURL, apiKey);
        isIncludeEmpty = isEmpty(style.include);
    } else if (style?.type === "custom" && style?.url) {
        mapStyleUrl = withAPIKey(style.url, apiKey);
    } else if (style?.type === "custom" && style?.json) {
        mapStyleUrl = style.json;
    } else {
        mapStyleUrl = buildBaseMapStyleURL({ id: DEFAULT_PUBLISHED_STYLE }, baseURL, apiKey);
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
