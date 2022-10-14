import { z } from "zod";

const combustionConsumptionModelSchema = z.object({
    speedsToConsumptionsLiters: z
        .array(
            z.object({
                speedKMH: z.number(),
                consumptionUnitsPer100KM: z.number()
            })
        )
        .optional(),
    auxiliaryPowerInLitersPerHour: z.number().optional(),
    fuelEnergyDensityInMJoulesPerLiter: z.number().optional(),
    currentFuelLiters: z.number().optional()
});

const electricConsumptionModelSchema = z.object({
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
    recuperationInKWHPerKMAltitudeLoss: z.number().optional(),
    currentChargeKWH: z.number().optional(),
    maxChargeKWH: z.number().optional()
});

const vehicleConsumptionSchema = z
    .object({
        engineType: z.enum(["combustion", "electric"]).optional(),
        efficiency: z
            .object({
                acceleration: z.number().min(0).max(1),
                deceleration: z.number().min(0).max(1),
                uphill: z.number().min(0).max(1),
                downhill: z.number().min(0).max(1)
            })
            .partial()
    })
    .merge(combustionConsumptionModelSchema)
    .merge(electricConsumptionModelSchema)
    .refine((data) => Boolean(data.speedsToConsumptionsLiters) || Boolean(data.speedsToConsumptionsKWH));

const vehicleDimensionsSchema = z
    .object({
        lengthMeters: z.number(),
        widthMeters: z.number(),
        heightMeters: z.number(),
        weightKG: z.number(),
        axleWeightKG: z.number()
    })
    .partial();

export const vehicleParametersSchema = z
    .object({
        consumption: vehicleConsumptionSchema,
        dimensions: vehicleDimensionsSchema,
        loadTypes: z.string().array(),
        maxSpeedKMH: z.number().min(0).max(250),
        adrCode: z.enum(["B", "C", "D", "E"]),
        commercial: z.boolean()
    })
    .partial();
