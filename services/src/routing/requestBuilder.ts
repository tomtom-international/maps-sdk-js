import {
    GeoInput,
    GeoInputType,
    getGeoInputType,
    getLngLatArray,
    inputSectionTypes,
    PathLike,
    Waypoint,
    WaypointLike,
    WaypointProps
} from "@anw/maps-sdk-js/core";
import isNil from "lodash/isNil";
import omit from "lodash/omit";
import { Position } from "geojson";
import {
    CalculateRouteParams,
    DepartArriveParams,
    InputSectionTypes,
    ThrillingParams
} from "./types/calculateRouteParams";
import { appendByRepeatingParamName, appendCommonParams } from "../shared/requestBuildingUtils";
import { VehicleDimensions, VehicleParameters } from "./types/vehicleParams";
import {
    ConsumptionModelEfficiency,
    ElectricConsumptionModel,
    SpeedToConsumptionRate,
    VehicleEngine,
    ChargingPreferences,
    ElectricVehicleEngine,
    CombustionVehicleEngine
} from "./types/vehicleEngineParams";
import { FetchInput } from "../shared/types/fetch";
import { CalculateRoutePOSTDataAPI, PointWaypointAPI } from "./types/apiPostRequestTypes";
import { LatLngPointAPI } from "./types/apiResponseTypes";

// Are these params about Long Distance EV Routing:
const isLDEVR = (params: CalculateRouteParams): boolean =>
    params.vehicle?.engine?.type == "electric" && !!params.vehicle.engine.chargingPreferences;

const buildURLBasePath = (params: CalculateRouteParams): string =>
    params.customServiceBaseURL ||
    `${params.commonBaseURL}/routing/1/${isLDEVR(params) ? "calculateLongDistanceEVRoute" : "calculateRoute"}`;

const getWaypointProps = (waypointInput: WaypointLike): WaypointProps | null =>
    (waypointInput as Waypoint).properties || null;

const buildLocationsStringFromWaypoints = (waypointInputs: WaypointLike[]): string =>
    waypointInputs
        .map((waypointInput: WaypointLike) => {
            const lngLat = getLngLatArray(waypointInput);
            const lngLatString = `${lngLat[1]},${lngLat[0]}`;
            const radius = getWaypointProps(waypointInput)?.radiusMeters;
            return radius ? `circle(${lngLatString},${radius})` : lngLatString;
        })
        .join(":");

export const getPositionsFromPath = (pathLike: PathLike): Position[] => {
    if (Array.isArray(pathLike)) {
        return pathLike;
    } else {
        return pathLike.geometry.coordinates;
    }
};

const getFirstAndLastPoints = (geoInputs: GeoInput[], types: GeoInputType[]): [Position, Position] => {
    let firstPoint;
    const firstGeoInput = geoInputs[0];
    if (types[0] === "path") {
        const positions = getPositionsFromPath(firstGeoInput as PathLike);
        firstPoint = positions[0];
    } else {
        firstPoint = getLngLatArray(firstGeoInput as WaypointLike);
    }

    let lastPoint;
    const lastGeoInput = geoInputs[geoInputs.length - 1];
    if (types[types.length - 1] === "path") {
        const positions = getPositionsFromPath(lastGeoInput as PathLike);
        lastPoint = positions[positions.length - 1];
    } else {
        lastPoint = getLngLatArray(lastGeoInput as WaypointLike);
    }

    return [firstPoint, lastPoint];
};

const buildLocationsString = (geoInputs: GeoInput[], geoInputTypes: GeoInputType[]): string =>
    buildLocationsStringFromWaypoints(
        geoInputTypes.includes("path") ? getFirstAndLastPoints(geoInputs, geoInputTypes) : (geoInputs as WaypointLike[])
    );

const appendWhenParams = (urlParams: URLSearchParams, when?: DepartArriveParams): void => {
    if (when?.date) {
        const formattedDate = when.date.toISOString();
        if (when.option == "departAt") {
            urlParams.append("departAt", formattedDate);
        } else if (when.option == "arriveBy") {
            urlParams.append("arriveAt", formattedDate);
        }
    }
};

const appendThrillingParams = (urlParams: URLSearchParams, thrillingParams?: ThrillingParams): void => {
    if (thrillingParams) {
        thrillingParams.hilliness && urlParams.append("hilliness", thrillingParams.hilliness);
        thrillingParams.windingness && urlParams.append("windingness", thrillingParams.windingness);
    }
};

const appendSectionTypes = (urlParams: URLSearchParams, sectionTypes?: InputSectionTypes): void => {
    const effectiveSectionTypes = (sectionTypes || inputSectionTypes).map((sectionType) =>
        sectionType === "vehicleRestricted" ? "travelMode" : sectionType
    );
    appendByRepeatingParamName(urlParams, "sectionType", effectiveSectionTypes);
};

const appendConsumptionEfficiency = (urlParams: URLSearchParams, efficiency?: ConsumptionModelEfficiency): void => {
    if (efficiency) {
        !isNil(efficiency.acceleration) && urlParams.append("accelerationEfficiency", String(efficiency.acceleration));
        !isNil(efficiency.deceleration) && urlParams.append("decelerationEfficiency", String(efficiency.deceleration));
        !isNil(efficiency.uphill) && urlParams.append("uphillEfficiency", String(efficiency.uphill));
        !isNil(efficiency.downhill) && urlParams.append("downhillEfficiency", String(efficiency.downhill));
    }
};

// e.g. 50,6.3:130,11.5
const buildSpeedToConsumptionString = (speedsToConsumptions: SpeedToConsumptionRate[]): string =>
    speedsToConsumptions
        .map((speedToConsumption) => `${speedToConsumption.speedKMH},${speedToConsumption.consumptionUnitsPer100KM}`)
        .join(":");

const appendCombustionEngine = (urlParams: URLSearchParams, engine: CombustionVehicleEngine): void => {
    // (no need to append combustion vehicleEngineType since it's the default)
    const consumptionModel = engine.model.consumption;
    consumptionModel.speedsToConsumptionsLiters &&
        urlParams.append(
            "constantSpeedConsumptionInLitersPerHundredkm",
            buildSpeedToConsumptionString(consumptionModel.speedsToConsumptionsLiters)
        );
    !isNil(consumptionModel.auxiliaryPowerInLitersPerHour) &&
        urlParams.append("auxiliaryPowerInLitersPerHour", String(consumptionModel.auxiliaryPowerInLitersPerHour));
    !isNil(consumptionModel.fuelEnergyDensityInMJoulesPerLiter) &&
        urlParams.append(
            "fuelEnergyDensityInMJoulesPerLiter",
            String(consumptionModel.fuelEnergyDensityInMJoulesPerLiter)
        );
    engine.currentFuelInLiters && urlParams.append("currentFuelInLiters", String(engine.currentFuelInLiters));
};

const appendElectricConsumptionModel = (urlParams: URLSearchParams, model: ElectricConsumptionModel): void => {
    model.speedsToConsumptionsKWH &&
        urlParams.append(
            "constantSpeedConsumptionInkWhPerHundredkm",
            buildSpeedToConsumptionString(model.speedsToConsumptionsKWH)
        );
    !isNil(model.auxiliaryPowerInkW) && urlParams.append("auxiliaryPowerInkW", String(model.auxiliaryPowerInkW));
    !isNil(model.consumptionInKWHPerKMAltitudeGain) &&
        urlParams.append("consumptionInkWhPerkmAltitudeGain", String(model.consumptionInKWHPerKMAltitudeGain));
    !isNil(model.recuperationInKWHPerKMAltitudeLoss) &&
        urlParams.append("recuperationInkWhPerkmAltitudeLoss", String(model.recuperationInKWHPerKMAltitudeLoss));
};

const appendChargingPreferences = (
    urlParams: URLSearchParams,
    preferences: ChargingPreferences | undefined,
    maxChargeKWH: number
): void => {
    if (!preferences) {
        return;
    }
    urlParams.append(
        "minChargeAtDestinationInkWh",
        String((maxChargeKWH * preferences.minChargeAtDestinationPCT) / 100)
    );
    urlParams.append(
        "minChargeAtChargingStopsInkWh",
        String((maxChargeKWH * preferences.minChargeAtChargingStopsPCT) / 100)
    );
};

const appendElectricCharging = (urlParams: URLSearchParams, engine: ElectricVehicleEngine): void => {
    const chargingModel = engine.model.charging;
    if (chargingModel?.maxChargeKWH) {
        urlParams.append("maxChargeInkWh", String(chargingModel.maxChargeKWH));
        engine.currentChargePCT &&
            urlParams.append(
                "currentChargeInkWh",
                String((chargingModel.maxChargeKWH * engine.currentChargePCT) / 100)
            );
        appendChargingPreferences(urlParams, engine.chargingPreferences, chargingModel.maxChargeKWH);
    }
    // (the rest of the charging model goes as POST data)
};

const appendElectricEngine = (urlParams: URLSearchParams, engine: ElectricVehicleEngine): void => {
    urlParams.append("vehicleEngineType", "electric");
    appendElectricConsumptionModel(urlParams, engine.model.consumption);
    appendElectricCharging(urlParams, engine);
};

const appendVehicleEngine = (urlParams: URLSearchParams, engine?: VehicleEngine): void => {
    if (engine) {
        // (efficiency params have the same names between engine types)
        appendConsumptionEfficiency(urlParams, engine.model.consumption.efficiency);
        if (engine.type === "electric") {
            appendElectricEngine(urlParams, engine);
        } else {
            appendCombustionEngine(urlParams, engine);
        }
    }
};

const appendVehicleDimensions = (urlParams: URLSearchParams, dimensions?: VehicleDimensions): void => {
    if (dimensions) {
        // (defaults are 0):
        dimensions.lengthMeters && urlParams.append("vehicleLength", String(dimensions.lengthMeters));
        dimensions.heightMeters && urlParams.append("vehicleHeight", String(dimensions.heightMeters));
        dimensions.widthMeters && urlParams.append("vehicleWidth", String(dimensions.widthMeters));
        dimensions.weightKG && urlParams.append("vehicleWeight", String(dimensions.weightKG));
        dimensions.axleWeightKG && urlParams.append("vehicleAxleWeight", String(dimensions.axleWeightKG));
    }
};

const appendVehicleParams = (urlParams: URLSearchParams, vehicleParams?: VehicleParameters): void => {
    if (vehicleParams) {
        appendVehicleEngine(urlParams, vehicleParams.engine);
        appendVehicleDimensions(urlParams, vehicleParams.dimensions);
        appendByRepeatingParamName(urlParams, "vehicleLoadType", vehicleParams.loadTypes);
        vehicleParams.adrCode && urlParams.append("vehicleAdrTunnelRestrictionCode", vehicleParams.adrCode);
        vehicleParams.commercial && urlParams.append("vehicleCommercial", String(vehicleParams.commercial));
        // (default is 0):
        vehicleParams.maxSpeedKMH && urlParams.append("vehicleMaxSpeed", String(vehicleParams.maxSpeedKMH));
    }
};

const toLatLngPointAPI = (position: Position): LatLngPointAPI => ({ latitude: position[1], longitude: position[0] });

// appends a path into the given post data, adding to supportingPoints and pointWaypoints as applicable
const appendPathPOSTData = (
    pathGeoInput: PathLike,
    geoInputIndex: number,
    geoInputs: GeoInput[],
    supportingPoints: LatLngPointAPI[],
    pointWaypoints: PointWaypointAPI[]
): void => {
    // first we add the supportingPoints from the path coordinates:
    const supportingPointsLengthBeforePath = supportingPoints.length;
    for (const position of getPositionsFromPath(pathGeoInput)) {
        supportingPoints.push(toLatLngPointAPI(position));
    }
    // then we check if it's a route, and if so we add waypoints from its legs as applicable
    // (a route leg is the portion of the path between 2 waypoints)
    if (!Array.isArray(pathGeoInput)) {
        const legs = pathGeoInput.properties.sections.leg;
        // (We assume all routes have at least 1 leg)
        legs.forEach((leg, legIndex) => {
            // If the route is the first geo-input, we skip adding the leg...
            // ... since it's expected to be already in the origin "location"
            if (geoInputIndex > 0 || legIndex > 0) {
                pointWaypoints.push({
                    supportingPointIndex: supportingPointsLengthBeforePath + (leg.startPointIndex as number),
                    waypointSourceType: "USER_DEFINED"
                });
            }
        });
        // If the route isn't the last geo-input, we add its destination as pointWaypoint too:
        // (If it's the last geo-input, we skip adding the leg...
        // ... since it's expected to be already in the destination "location")
        if (geoInputIndex < geoInputs.length - 1) {
            pointWaypoints.push({
                supportingPointIndex: supportingPointsLengthBeforePath + pathGeoInput.geometry.coordinates.length - 1,
                waypointSourceType: "USER_DEFINED"
            });
        }
    }
};

// appends a waypoint into the given post data, adding to supportingPoints and pointWaypoints as applicable
const appendWaypointPOSTData = (
    waypoint: WaypointLike,
    geoInputIndex: number,
    geoInputs: GeoInput[],
    supportingPoints: LatLngPointAPI[],
    pointWaypoints: PointWaypointAPI[]
) => {
    // individual points are treated like POST waypoints
    supportingPoints.push(toLatLngPointAPI(getLngLatArray(waypoint)));
    // for origin and destination we do not add pointWaypoints, since they end up as the URL "locations":
    if (geoInputIndex > 0 && geoInputIndex < geoInputs.length - 1) {
        pointWaypoints.push({
            supportingPointIndex: supportingPoints.length - 1,
            waypointSourceType: "USER_DEFINED"
        });
    }
};

const buildGeoInputsPOSTData = (
    geoInputs: GeoInput[],
    types: GeoInputType[]
): { supportingPoints: LatLngPointAPI[]; pointWaypoints?: PointWaypointAPI[] } => {
    const supportingPoints: LatLngPointAPI[] = [];
    const pointWaypoints: PointWaypointAPI[] = [];

    geoInputs.forEach((geoInput, geoInputIndex) => {
        if (types[geoInputIndex] === "path") {
            appendPathPOSTData(geoInput as PathLike, geoInputIndex, geoInputs, supportingPoints, pointWaypoints);
        } else {
            appendWaypointPOSTData(
                geoInput as WaypointLike,
                geoInputIndex,
                geoInputs,
                supportingPoints,
                pointWaypoints
            );
        }
    });

    return { supportingPoints, ...(pointWaypoints.length && { pointWaypoints }) };
};

const buildPOSTData = (params: CalculateRouteParams, types: GeoInputType[]): CalculateRoutePOSTDataAPI | null => {
    const pathsIncluded = types.includes("path");
    const ldevr = isLDEVR(params);
    if (!pathsIncluded && !ldevr) {
        // (if no paths in the given geoInputs nor LDEVR, there'll be no POST data, which will trigger a GET call)
        return null;
    }

    const chargingModel = (params.vehicle?.engine as ElectricVehicleEngine)?.model.charging;
    return {
        ...(pathsIncluded && buildGeoInputsPOSTData(params.geoInputs, types)),
        ...(ldevr && chargingModel && { chargingParameters: omit(chargingModel, "maxChargeKWH") })
    };
};

/**
 * Default method for building calculate route request from {@link CalculateRouteParams}
 * @param params The calculate route parameters, with global configuration already merged into them.
 */
export const buildCalculateRouteRequest = (params: CalculateRouteParams): FetchInput<CalculateRoutePOSTDataAPI> => {
    const geoInputTypes = params.geoInputs.map(getGeoInputType);
    const url = new URL(`${buildURLBasePath(params)}/${buildLocationsString(params.geoInputs, geoInputTypes)}/json`);
    const urlParams: URLSearchParams = url.searchParams;
    appendCommonParams(urlParams, params);
    const costModel = params.costModel;
    appendByRepeatingParamName(urlParams, "avoid", costModel?.avoid);
    params.computeAdditionalTravelTimeFor &&
        urlParams.append("computeTravelTimeFor", params.computeAdditionalTravelTimeFor);
    !isNil(costModel?.considerTraffic) && urlParams.append("traffic", String(costModel?.considerTraffic));
    params.currentHeading && urlParams.append("vehicleHeading", String(params.currentHeading));
    appendWhenParams(urlParams, params.when);
    params.instructionsType && urlParams.append("instructionsType", params.instructionsType);
    !isNil(params.maxAlternatives) && urlParams.append("maxAlternatives", String(params.maxAlternatives));
    params.routeRepresentation && urlParams.append("routeRepresentation", params.routeRepresentation);
    costModel?.routeType && urlParams.append("routeType", costModel.routeType);
    appendSectionTypes(urlParams, params.sectionTypes);
    params.travelMode && urlParams.append("travelMode", params.travelMode);
    if (costModel?.routeType == "thrilling") {
        appendThrillingParams(urlParams, costModel.thrillingParams);
    }
    appendVehicleParams(urlParams, params.vehicle);

    const postData = buildPOSTData(params, geoInputTypes);
    if (postData) {
        return {
            method: "POST",
            url,
            data: postData
        };
    } else {
        return { method: "GET", url };
    }
};
