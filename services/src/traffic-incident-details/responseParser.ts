import {
    iconToTrafficIncidentCategory,
    indexedMagnitudes,
    type TrafficIncident,
    type TrafficIncidentDetails,
    type TrafficIncidentEvent,
    type TrafficIncidentProbability,
    type TrafficIncidentTimeValidity,
    type TrafficIncidentTMC,
} from '@tomtom-org/maps-sdk/core';
import type { IncidentAPI, IncidentDetailsResponseAPI, IncidentEventAPI, IncidentTMCAPI } from './types/apiTypes';

const parseEvent = (apiEvent: IncidentEventAPI): TrafficIncidentEvent => ({
    description: apiEvent.description,
    code: apiEvent.code,
    category: iconToTrafficIncidentCategory(apiEvent.iconCategory),
});

const parseTMC = (apiTMC: IncidentTMCAPI): TrafficIncidentTMC => ({
    countryCode: apiTMC.countryCode,
    tableNumber: apiTMC.tableNumber,
    tableVersion: apiTMC.tableVersion,
    direction: apiTMC.direction as 'positive' | 'negative',
    points: (apiTMC.points ?? []).map((p) => ({
        location: p.location,
        ...(p.offset !== undefined && { offset: p.offset }),
    })),
});

const parseIncident = (apiIncident: IncidentAPI): TrafficIncident => {
    const p = apiIncident.properties;
    return {
        type: 'Feature',
        geometry: apiIncident.geometry,
        properties: {
            id: p.id,
            category: iconToTrafficIncidentCategory(p.iconCategory),
            magnitudeOfDelay: indexedMagnitudes[p.magnitudeOfDelay] ?? 'unknown',
            events: (p.events ?? []).map(parseEvent),
            ...(p.startTime && { startTime: new Date(p.startTime) }),
            ...(p.endTime && { endTime: new Date(p.endTime) }),
            ...(p.from && { from: p.from }),
            ...(p.to && { to: p.to }),
            ...(p.length !== undefined && { lengthInMeters: p.length }),
            ...(p.delay !== undefined && { delayInSeconds: p.delay }),
            ...(p.roadNumbers && { roadNumbers: p.roadNumbers }),
            timeValidity: p.timeValidity as TrafficIncidentTimeValidity,
            ...(p.probabilityOfOccurrence && {
                probabilityOfOccurrence: p.probabilityOfOccurrence as TrafficIncidentProbability,
            }),
            ...(p.numberOfReports !== undefined && { numberOfReports: p.numberOfReports }),
            ...(p.lastReportTime && { lastReportTime: new Date(p.lastReportTime) }),
            ...(p.tmc && { tmc: parseTMC(p.tmc) }),
        },
    };
};

/**
 * Default method for parsing a traffic incident details API response.
 * @param apiResponse The raw Traffic Incident Details API response.
 */
export const parseTrafficIncidentDetailsResponse = (
    apiResponse: IncidentDetailsResponseAPI,
): TrafficIncidentDetails => ({
    type: 'FeatureCollection',
    features: (apiResponse.incidents ?? []).filter((i): i is IncidentAPI => i !== null).map(parseIncident),
});
