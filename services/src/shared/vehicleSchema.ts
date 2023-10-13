import { z } from "zod";
import { currentTypes, plugTypes } from "@anw/maps-sdk-js/core";

const efficiencySchema = z
    .object({
        efficiency: z
            .object({
                acceleration: z.number().min(0).max(1),
                deceleration: z.number().min(0).max(1),
                uphill: z.number().min(0).max(1),
                downhill: z.number().min(0).max(1)
            })
            .partial()
    })
    .partial();

const combustionModelSchema = z.object({
    consumption: efficiencySchema.merge(
        z.object({
            speedsToConsumptionsLiters: z
                .array(
                    z.object({
                        speedKMH: z.number(),
                        consumptionUnitsPer100KM: z.number()
                    })
                )
                .optional(),
            auxiliaryPowerInLitersPerHour: z.number().optional(),
            fuelEnergyDensityInMJoulesPerLiter: z.number().optional()
        })
    )
});

const chargingConnectorSchema = z.object({
    currentType: z.enum(currentTypes),
    plugTypes: z.array(z.enum(plugTypes)).min(1),
    efficiency: z.number().optional(),
    baseLoadInkW: z.number().optional(),
    maxPowerInkW: z.number().optional(),
    maxVoltageInV: z.number().optional(),
    maxCurrentInA: z.number().optional(),
    voltageRange: z
        .object({
            minVoltageInV: z.number().optional(),
            maxVoltageInV: z.number().optional()
        })
        .optional()
});

const batteryCurveSchema = z.object({
    stateOfChargeInkWh: z.number().min(0),
    maxPowerInkW: z.number().positive()
});

const electricEngineModelSchema = z.object({
    consumption: efficiencySchema.merge(
        z.object({
            speedsToConsumptionsKWH: z
                .array(
                    z.object({
                        speedKMH: z.number(),
                        consumptionUnitsPer100KM: z.number()
                    })
                )
                .optional(),
            auxiliaryPowerInkW: z.number().optional(),
            consumptionInKWHPerKMAltitudeGain: z.number().max(500.0).optional(),
            recuperationInKWHPerKMAltitudeLoss: z.number().optional()
        })
    ),
    charging: z
        .object({
            maxChargeKWH: z.number(),
            batteryCurve: z.array(batteryCurveSchema).optional(),
            connectors: z.array(chargingConnectorSchema).min(1).optional()
        })
        .optional()
});

const combustionEngineSchema = z.object({
    type: z.literal("combustion"),
    currentFuelInLiters: z.number(),
    model: combustionModelSchema
});

const pct = z.number().min(0).max(100);

const electricEngineSchema = z.object({
    type: z.literal("electric"),
    currentChargePCT: pct,
    model: electricEngineModelSchema,
    chargingPreferences: z
        .object({
            minChargeAtDestinationPCT: pct,
            minChargeAtChargingStopsPCT: pct
        })
        .optional()
});

const vehicleDimensionsSchema = z
    .object({
        lengthMeters: z.number(),
        widthMeters: z.number(),
        heightMeters: z.number(),
        weightKG: z.number(),
        axleWeightKG: z.number()
    })
    .partial();

/**
 * @ignore
 */
export const vehicleParametersSchema = z
    .object({
        engine: z.discriminatedUnion("type", [combustionEngineSchema, electricEngineSchema]),
        dimensions: vehicleDimensionsSchema,
        loadTypes: z.string().array(),
        maxSpeedKMH: z.number().min(0).max(250),
        adrCode: z.enum(["B", "C", "D", "E"]),
        commercial: z.boolean()
    })
    .partial();
