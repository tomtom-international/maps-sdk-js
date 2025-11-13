import type { StyleSpecification } from 'maplibre-gl';
import type { StandardStyle, StandardStyleID, StyleInput, StyleModule, TomTomMapParams } from './types/mapInit';
import { styleModules } from './types/mapInit';

const DEFAULT_STANDARD_STYLE_ID: StandardStyleID = 'standardLight';
const URL_PREFIX = '${baseURL}/maps/orbis/assets/styles/${version}/style.json?&apiVersion=1&key=${apiKey}';

const standardStyleModulesValues: Record<StandardStyleID, Record<StyleModule, string>> = {
    standardLight: {
        trafficIncidents: 'incidents_light',
        trafficFlow: 'flow_relative-light',
        hillshade: 'hillshade_light',
    },
    standardDark: {
        trafficIncidents: 'incidents_dark',
        trafficFlow: 'flow_relative-dark',
        hillshade: 'hillshade_dark',
    },
    drivingLight: {
        trafficIncidents: 'incidents_light',
        trafficFlow: 'flow_relative-light',
        hillshade: 'hillshade_light',
    },
    drivingDark: {
        trafficIncidents: 'incidents_dark',
        trafficFlow: 'flow_relative-dark',
        hillshade: 'hillshade_dark',
    },
    monoLight: {
        trafficIncidents: 'incidents_light',
        trafficFlow: 'flow_relative-light',
        hillshade: 'hillshade_mono-light',
    },
    monoDark: {
        trafficIncidents: 'incidents_dark',
        trafficFlow: 'flow_relative-dark',
        hillshade: 'hillshade_mono-dark',
    },
    satellite: {
        trafficIncidents: 'incidents_light',
        trafficFlow: 'flow_relative-light',
        hillshade: 'hillshade_satellite',
    },
};

const baseMapStyleUrlTemplate = (suffix: string): string => `${URL_PREFIX}&map=${suffix}`;

const baseMapStyleUrlTemplates: Record<StandardStyleID, string> = {
    standardLight: baseMapStyleUrlTemplate('basic_street-light'),
    standardDark: baseMapStyleUrlTemplate('basic_street-dark'),
    drivingLight: baseMapStyleUrlTemplate('basic_street-light-driving'),
    drivingDark: baseMapStyleUrlTemplate('basic_street-dark-driving'),
    monoLight: baseMapStyleUrlTemplate('basic_mono-light'),
    monoDark: baseMapStyleUrlTemplate('basic_mono-dark'),
    satellite: baseMapStyleUrlTemplate('basic_street-satellite'),
};

const buildStandardStyleUrl = (standardStyle: StandardStyle, baseUrl: string, apiKey: string): string => {
    const standardStyleID = standardStyle.id ?? DEFAULT_STANDARD_STYLE_ID;

    const styleURL = new URL(
        baseMapStyleUrlTemplates[standardStyleID]
            .replace('${baseURL}', baseUrl)
            .replace('${version}', standardStyle.version ?? '0.6.0-0')
            .replace('${apiKey}', apiKey),
    );

    for (const module of standardStyle.include ?? styleModules) {
        styleURL.searchParams.append(module, standardStyleModulesValues[standardStyleID][module]);
    }

    return styleURL.toString();
};

const withApiKey = (givenUrl: string, apiKey: string): string => {
    const url = new URL(givenUrl);
    if (!url.searchParams.has('key')) {
        url.searchParams.set('key', apiKey);
    } else {
        console.warn(
            'The style URL is coming with an API key parameter which takes priority. ' +
                'If you want to use the SDK configured API key, remove the key param from the style URL',
        );
    }
    return url.toString();
};

/**
 * @ignore
 * @param mapParams The SDK parameters to convert to input renderer style.
 * @return The map style to load into the renderer.
 */
export const buildStyleInput = (mapParams: TomTomMapParams): StyleSpecification | string => {
    const style = mapParams.style;
    const baseUrl = mapParams.commonBaseURL;
    const apiKey = mapParams.apiKey;

    if (typeof style === 'string') {
        return buildStandardStyleUrl({ id: style }, baseUrl, apiKey);
    } else if (style?.type === 'standard') {
        return buildStandardStyleUrl(style, baseUrl, apiKey);
    } else if (style?.type === 'custom' && style?.url) {
        return withApiKey(style.url, apiKey);
    } else if (style?.type === 'custom' && style?.json) {
        return style.json;
    }

    // no style defined, use default
    return buildStandardStyleUrl({ id: DEFAULT_STANDARD_STYLE_ID }, baseUrl, apiKey);
};

/**
 * Includes the previous standard style parts into the given standard style if the new one didn't define any.
 * * Both new and previous styles must be of "standard" type.
 * @ignore
 */
export const withPreviousStyleParts = (style: StyleInput, previousStyle?: StyleInput): StyleInput => {
    if (
        previousStyle &&
        typeof previousStyle === 'object' &&
        previousStyle.type === 'standard' &&
        previousStyle.include
    ) {
        if (typeof style === 'string' || (style.type === 'standard' && !style.include)) {
            return {
                type: 'standard',
                id: typeof style === 'string' ? style : style.id,
                include: (previousStyle as StandardStyle).include,
            };
        }
    }
    return style;
};
