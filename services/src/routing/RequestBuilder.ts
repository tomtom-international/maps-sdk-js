import { getLngLatArray, inputSectionTypes, Waypoint, WaypointLike, WaypointProps } from "@anw/go-sdk-js/core";
import isNil from "lodash/isNil";
import { Position } from "geojson";
import {
    CalculateRouteParams,
    CalculateRouteWaypointInputs,
    DepartArriveParams,
    InputSectionTypes,
    SupportingPoints,
    ThrillingParams
} from "./types/CalculateRouteParams";
import { CommonServiceParams } from "../shared";
import { appendByRepeatingParamName, appendCommonParams } from "../shared/RequestBuildingUtils";
import {
    CombustionConsumptionModel,
    ConsumptionModelEfficiency,
    ElectricConsumptionModel,
    SpeedToConsumptionRate,
    VehicleConsumption,
    VehicleDimensions,
    VehicleParameters
} from "./types/VehicleParams";
import { FetchInput } from "../shared/types/Fetch";
import { CalculateRoutePOSTDataAPI, SupportingPointsAPI } from "./types/APIPOSTRequestTypes";

const buildURLBasePath = (params: CommonServiceParams): string =>
    params.customServiceBaseURL || `${params.commonBaseURL}/routing/1/calculateRoute`;

const getWaypointProps = (waypointInput: WaypointLike): WaypointProps | null =>
    (waypointInput as Waypoint).properties || null;

const buildLocationsStringFromWaypoints = (waypointInputs: CalculateRouteWaypointInputs): string =>
    waypointInputs
        .map((waypointInput: WaypointLike) => {
            const lngLat = getLngLatArray(waypointInput);
            const lngLatString = `${lngLat[1]},${lngLat[0]}`;
            const radius = getWaypointProps(waypointInput)?.radiusMeters;
            return radius ? `circle(${lngLatString},${radius})` : lngLatString;
        })
        .join(":");

const getPositionsFromSupportingPoints = (supportingPoints?: SupportingPoints): Position[] | undefined => {
    if (supportingPoints) {
        if (Array.isArray(supportingPoints)) {
            if (supportingPoints.length) {
                return supportingPoints;
            }
        } else if (supportingPoints.geometry.coordinates.length) {
            return supportingPoints.geometry.coordinates;
        }
    }
    return undefined;
};

const buildLocationsString = (params: CalculateRouteParams): string => {
    if (params.locations) {
        return buildLocationsStringFromWaypoints(params.locations);
    } else {
        const positions = getPositionsFromSupportingPoints(params.supportingPoints);
        if (positions && positions.length >= 2) {
            // we use the first and last supporting points:
            return buildLocationsStringFromWaypoints([
                positions[0],
                positions[positions.length - 1]
            ] as CalculateRouteWaypointInputs);
        }
    }
    throw Error("No locations nor supporting points defined");
};

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

const appendCombustionConsumptionModel = (urlParams: URLSearchParams, model: CombustionConsumptionModel): void => {
    model.speedsToConsumptionsLiters &&
        urlParams.append(
            "constantSpeedConsumptionInLitersPerHundredkm",
            buildSpeedToConsumptionString(model.speedsToConsumptionsLiters)
        );
    !isNil(model.auxiliaryPowerInLitersPerHour) &&
        urlParams.append("auxiliaryPowerInLitersPerHour", String(model.auxiliaryPowerInLitersPerHour));
    !isNil(model.fuelEnergyDensityInMJoulesPerLiter) &&
        urlParams.append("fuelEnergyDensityInMJoulesPerLiter", String(model.fuelEnergyDensityInMJoulesPerLiter));
    !isNil(model.currentFuelLiters) && urlParams.append("currentFuelInLiters", String(model.currentFuelLiters));
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
    !isNil(model.maxChargeKWH) && urlParams.append("maxChargeInkWh", String(model.maxChargeKWH));
    !isNil(model.currentChargeKWH) && urlParams.append("currentChargeInkWh", String(model.currentChargeKWH));
};

const appendVehicleConsumption = (urlParams: URLSearchParams, consumption?: VehicleConsumption): void => {
    if (consumption) {
        consumption.engineType && urlParams.append("vehicleEngineType", consumption.engineType);
        appendConsumptionEfficiency(urlParams, consumption.efficiency);
        if (consumption.engineType === "electric") {
            appendElectricConsumptionModel(urlParams, consumption as ElectricConsumptionModel);
        } else {
            appendCombustionConsumptionModel(urlParams, consumption as CombustionConsumptionModel);
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
        appendVehicleConsumption(urlParams, vehicleParams.consumption);
        appendVehicleDimensions(urlParams, vehicleParams.dimensions);
        appendByRepeatingParamName(urlParams, "vehicleLoadType", vehicleParams.loadTypes);
        vehicleParams.adrCode && urlParams.append("vehicleAdrTunnelRestrictionCode", vehicleParams.adrCode);
        vehicleParams.commercial && urlParams.append("vehicleCommercial", String(vehicleParams.commercial));
        // (default is 0):
        vehicleParams.maxSpeedKMH && urlParams.append("vehicleMaxSpeed", String(vehicleParams.maxSpeedKMH));
    }
};

const toAPISupportingPoints = (positions: Position[]): SupportingPointsAPI =>
    positions.map((position) => ({ latitude: position[1], longitude: position[0] }));

/**
 * Default method for building calculate route request from {@link CalculateRouteParams}
 * @group Calculate Route
 * @category Functions
 * @param params The calculate route parameters, with global configuration already merged into them.
 */
export const buildCalculateRouteRequest = (params: CalculateRouteParams): FetchInput<CalculateRoutePOSTDataAPI> => {
    const url = new URL(`${buildURLBasePath(params)}/${buildLocationsString(params)}/json`);
    const urlParams: URLSearchParams = url.searchParams;
    appendCommonParams(urlParams, params);
    appendByRepeatingParamName(urlParams, "avoid", params.avoid);
    params.computeAdditionalTravelTimeFor &&
        urlParams.append("computeTravelTimeFor", params.computeAdditionalTravelTimeFor);
    !isNil(params.considerTraffic) && urlParams.append("traffic", String(params.considerTraffic));
    params.currentHeading && urlParams.append("vehicleHeading", String(params.currentHeading));
    appendWhenParams(urlParams, params.when);
    params.instructionsType && urlParams.append("instructionsType", params.instructionsType);
    !isNil(params.maxAlternatives) && urlParams.append("maxAlternatives", String(params.maxAlternatives));
    params.routeRepresentation && urlParams.append("routeRepresentation", params.routeRepresentation);
    params.routeType && urlParams.append("routeType", params.routeType);
    appendSectionTypes(urlParams, params.sectionTypes);
    params.travelMode && urlParams.append("travelMode", params.travelMode);
    if (params.routeType == "thrilling") {
        appendThrillingParams(urlParams, params.thrillingParams);
    }
    appendVehicleParams(urlParams, params.vehicle);

    const supportingPoints = getPositionsFromSupportingPoints(params.supportingPoints);
    if (supportingPoints) {
        return {
            method: "POST",
            url,
            data: { supportingPoints: toAPISupportingPoints(supportingPoints) }
        };
    } else {
        return { method: "GET", url };
    }
};
