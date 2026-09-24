import {
    CombustionEngineModel,
    ElectricEngineModel,
    VehicleEngineModel,
    VehicleEngineType,
} from '../types/vehicleEngineParams';
import { VehicleDimensions } from '../types/vehicleModel';
import { ElectricVehicleParams, VehicleParameters } from '../types/vehicleParams';
import {
    appendEnergyParams,
    combustionConsumptionParams,
    currentChargeParams,
    currentFuelParams,
    electricConsumptionParams,
    maxChargeParams,
} from './vehicleEnergyParams';

const appendVehicleState = (urlParams: URLSearchParams, vehicleParams: VehicleParameters): void => {
    // A generic vehicle declares no engine, so it carries no charge or fuel to report.
    if (!vehicleParams.state || !('engineType' in vehicleParams)) {
        return;
    }

    const params = vehicleParams.engineType === 'electric' ? currentChargeParams : currentFuelParams;
    appendEnergyParams(urlParams, params(vehicleParams));
};

const appendVehicleDimensions = (urlParams: URLSearchParams, dimensions?: VehicleDimensions): void => {
    // (default is 0):
    if (dimensions?.weightKG) urlParams.append('vehicleWeight', String(dimensions.weightKG));
};

const appendVehicleRestrictions = (urlParams: URLSearchParams, vehicleParams: VehicleParameters): void => {
    // (default is 0):
    const maxSpeedKMH = vehicleParams.restrictions?.maxSpeedKMH;
    if (maxSpeedKMH) urlParams.append('vehicleMaxSpeed', String(maxSpeedKMH));

    // This V2 endpoint spells it "Electric"; the V3 routing endpoints spell it "Electronic" and
    // take it in the POST body. Each rejects the other's name.
    const tollTransponder = vehicleParams.restrictions?.tollTransponder;
    if (tollTransponder) urlParams.append('vehicleHasElectricTollCollectionTransponder', tollTransponder);
};

const appendVehicleEngineModel = (
    urlParams: URLSearchParams,
    engineType: VehicleEngineType,
    engine: VehicleEngineModel<VehicleEngineType>,
): void => {
    if (engineType === 'electric') {
        const electricEngine = engine as ElectricEngineModel;
        appendEnergyParams(urlParams, {
            ...electricConsumptionParams(electricEngine.consumption),
            ...maxChargeParams(electricEngine),
        });

        return;
    }

    // (no need to append combustion vehicleEngineType since it's the default)
    appendEnergyParams(urlParams, combustionConsumptionParams(engine as CombustionEngineModel));
};

const appendVehicleModel = (urlParams: URLSearchParams, vehicleParams: VehicleParameters): void => {
    if (!vehicleParams.model) {
        return;
    }

    // Handle predefined vehicle model
    if ('variantId' in vehicleParams.model) {
        urlParams.append('vehicleModelId', vehicleParams.model.variantId);
    } else {
        // Handle explicit vehicle model (dimensions and engine)
        appendVehicleDimensions(urlParams, vehicleParams.model.dimensions);

        if (vehicleParams.model.engine) {
            appendVehicleEngineModel(
                urlParams,
                'engineType' in vehicleParams ? vehicleParams.engineType : undefined,
                vehicleParams.model.engine,
            );
        }
    }
};

/**
 * Appends vehicle parameters to the query of a GET routing request.
 *
 * @remarks
 * Charging preferences are deliberately absent: they encode to `minChargeAt*InkWh`, which only the
 * charging-stops endpoint accepts, and that endpoint builds its own query in `routing/requestBuilder.ts`.
 */
export const appendVehicleParams = (urlParams: URLSearchParams, vehicleParams?: VehicleParameters): void => {
    if (!vehicleParams) {
        return;
    }

    // the engine type defaults to combustion, thus we only bother to append it if it's electric:
    if ((vehicleParams as ElectricVehicleParams).engineType === 'electric') {
        urlParams.append('vehicleEngineType', 'electric');
    }

    appendVehicleModel(urlParams, vehicleParams);
    appendVehicleState(urlParams, vehicleParams);
    appendVehicleRestrictions(urlParams, vehicleParams);
};
