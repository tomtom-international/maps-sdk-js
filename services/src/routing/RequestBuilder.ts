import { getLngLatArray, inputSectionTypes, Waypoint, WaypointProps } from "@anw/go-sdk-js/core";
import isNil from "lodash/isNil";
import {
    CalculateRouteParams,
    DepartArriveParams,
    InputSectionTypes,
    ThrillingParams,
    WaypointInput,
    WaypointInputs
} from "./types/CalculateRouteParams";
import { CommonServiceParams } from "../shared/ServiceTypes";
import { appendCommonParams } from "../shared/RequestBuildingUtils";
import {
    CombustionConsumptionModel,
    ConsumptionModelEfficiency,
    ElectricConsumptionModel,
    SpeedToConsumptionRate,
    VehicleConsumption,
    VehicleDimensions,
    VehicleParameters
} from "./types/VehicleParams";

const buildURLBasePath = (params: CommonServiceParams): string =>
    params.customServiceBaseURL || `${params.commonBaseURL}routing/1/calculateRoute/`;

const getWaypointProps = (waypointInput: WaypointInput): WaypointProps | null =>
    (waypointInput as Waypoint).properties || null;

const buildWaypointsString = (waypointInputs: WaypointInputs): string => {
    return waypointInputs
        .map((waypointInput: WaypointInput) => {
            const lngLat = getLngLatArray(waypointInput);
            const lngLatString = `${lngLat[1]},${lngLat[0]}`;
            const radius = getWaypointProps(waypointInput)?.radiusMeters;
            return radius ? `circle(${lngLatString},${radius})` : lngLatString;
        })
        .join(":");
};

// Adds parameter from the array by repeating each array part into a query parameter of the same name.
// E.g. ...&avoid=motorways&avoid=ferries&...
const appendByRepeatingParamName = (urlParams: URLSearchParams, paramName: string, paramArray?: string[]): void => {
    for (const param of paramArray || []) {
        urlParams.append(paramName, param);
    }
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
    const effectiveSectionTypes = sectionTypes == "all" ? inputSectionTypes : sectionTypes;
    appendByRepeatingParamName(urlParams, "sectionType", effectiveSectionTypes);
};

const appendConsumptionEfficiency = (urlParams: URLSearchParams, efficiency?: ConsumptionModelEfficiency): void => {
    if (efficiency) {
        efficiency.acceleration && urlParams.append("accelerationEfficiency", String(efficiency.acceleration));
        efficiency.deceleration && urlParams.append("decelerationEfficiency", String(efficiency.deceleration));
        efficiency.uphill && urlParams.append("uphillEfficiency", String(efficiency.uphill));
        efficiency.downhill && urlParams.append("downhillEfficiency", String(efficiency.downhill));
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
    model.auxiliaryPowerInLitersPerHour &&
        urlParams.append("auxiliaryPowerInLitersPerHour", String(model.auxiliaryPowerInLitersPerHour));
    model.fuelEnergyDensityInMJoulesPerLiter &&
        urlParams.append("fuelEnergyDensityInMJoulesPerLiter", String(model.fuelEnergyDensityInMJoulesPerLiter));
    model.currentFuelLiters && urlParams.append("currentFuelInLiters", String(model.currentFuelLiters));
};

const appendElectricConsumptionModel = (urlParams: URLSearchParams, model: ElectricConsumptionModel): void => {
    model.speedsToConsumptionsKWH &&
        urlParams.append(
            "constantSpeedConsumptionInkWhPerHundredkm",
            buildSpeedToConsumptionString(model.speedsToConsumptionsKWH)
        );
    model.auxiliaryPowerInkW && urlParams.append("auxiliaryPowerInkW", String(model.auxiliaryPowerInkW));
    model.consumptionInKWHPerKMAltitudeGain &&
        urlParams.append("consumptionInkWhPerkmAltitudeGain", String(model.consumptionInKWHPerKMAltitudeGain));
    model.recuperationInKWHPerKMAltitudeLoss &&
        urlParams.append("recuperationInkWhPerkmAltitudeLoss", String(model.recuperationInKWHPerKMAltitudeLoss));
    model.maxChargeKWH && urlParams.append("maxChargeInkWh", String(model.maxChargeKWH));
    model.currentChargeKWH && urlParams.append("currentChargeInkWh", String(model.currentChargeKWH));
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
        vehicleParams.maxSpeedKMH && urlParams.append("vehicleMaxSpeed", String(vehicleParams.maxSpeedKMH));
    }
};

export const buildCalculateRouteRequest = (params: CalculateRouteParams): URL => {
    const url = new URL(`${buildURLBasePath(params)}${buildWaypointsString(params.locations)}/json`);
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
    return url;
};
