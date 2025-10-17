import { VehicleModel } from './vehicleModel';
import { VehiclePreferences } from './vehiclePreferences';
import { VehicleRestrictions } from './vehicleRestrictionParams';
import { VehicleState } from './vehicleState';

export type GenericVehicleParams = {
    /**
     * Model (static properties) of the vehicle with generic/unspecified engine type.
     */
    model?: VehicleModel;
    /**
     * State of the vehicle with generic/unspecified engine type.
     */
    state?: VehicleState;
    /**
     * Generic vehicle preferences for unspecified engine type.
     */
    preferences?: VehiclePreferences;
};

export type CombustionVehicleParams = {
    /**
     * Combustion vehicles.
     */
    engineType: 'combustion';
    /**
     * Model (static properties) specifically for combustion engine vehicles.
     */
    model?: VehicleModel<'combustion'>;
    /**
     * State specifically for combustion engine vehicles.
     */
    state?: VehicleState<'combustion'>;
    /**
     * Preferences specifically for combustion engine vehicles.
     */
    preferences?: VehiclePreferences<'combustion'>;
};

export type ElectricVehicleParams = {
    /*
     * Electric vehicles (EV).
     */
    engineType: 'electric';
    /**
     * Model (static properties) specifically for electric vehicles.
     */
    model?: VehicleModel<'electric'>;
    /**
     * State specifically for electric vehicles.
     */
    state?: VehicleState<'electric'>;
    /**
     * Preferences specifically for electric vehicles.
     */
    preferences?: VehiclePreferences<'electric'>;
};

/**
 * Object describing vehicle details
 */
export type VehicleParameters = (GenericVehicleParams | CombustionVehicleParams | ElectricVehicleParams) &
    VehicleRestrictions;
