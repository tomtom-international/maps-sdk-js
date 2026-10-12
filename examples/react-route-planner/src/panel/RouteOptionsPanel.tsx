import { avoidableTypes } from '@tomtom-org/maps-sdk/core';
import {
    arrivalSides,
    type DepartArriveParams,
    type MaxNumberOfAlternatives,
    routeTypes,
    tollTransponderOptions,
} from '@tomtom-org/maps-sdk/services';
import { keysOf } from '../keysOf';
import {
    arrivalSideLabels,
    avoidLooks,
    type RouteOptions,
    routeTypeLooks,
    tollTransponderLabels,
} from '../planner/routeOptions';
import { ChipChecklist, ChipChoice, Field, FieldGroup, Select, Toggle } from './fields';

type RouteOptionsPanelProps = { options: RouteOptions; onChange: (options: RouteOptions) => void };

const alternativeCounts: MaxNumberOfAlternatives[] = [0, 1, 2, 3, 4, 5];

export const RouteOptionsPanel = ({ options, onChange }: RouteOptionsPanelProps) => {
    const costModel = options.costModel ?? {};
    const update = (changes: Partial<RouteOptions>) => onChange({ ...options, ...changes });
    const updateCostModel = (changes: Partial<NonNullable<RouteOptions['costModel']>>) =>
        update({ costModel: { ...costModel, ...changes } });

    return (
        <>
            <div className="ui-section">
                <h4 className="ui-subheading">Route</h4>
                <FieldGroup label="Optimise for">
                    <ChipChoice
                        label="Optimise for"
                        options={routeTypes}
                        look={(routeType) => routeTypeLooks[routeType]}
                        value={costModel.routeType ?? 'fast'}
                        onChange={(routeType) => updateCostModel({ routeType })}
                    />
                </FieldGroup>
                <TimingField when={options.when} onChange={(when) => update({ when })} />
                <Field label="Alternatives">
                    <Select
                        options={alternativeCounts}
                        optionLabel={(count) => (count ? `Up to ${count}` : 'None')}
                        value={options.maxAlternatives ?? 0}
                        onChange={(maxAlternatives) => update({ maxAlternatives })}
                    />
                </Field>
                <Toggle
                    label="Live traffic"
                    checked={costModel.traffic !== 'historical'}
                    onChange={(live) => updateCostModel({ traffic: live ? 'live' : 'historical' })}
                />
                <Toggle
                    label="Compare traffic scenarios"
                    checked={options.computeTravelTimeFor === 'all'}
                    onChange={(checked) => update({ computeTravelTimeFor: checked ? 'all' : 'none' })}
                />
            </div>

            <div className="ui-section">
                <h4 className="ui-subheading">Avoid</h4>
                <ChipChecklist
                    label="Avoid"
                    compact
                    options={avoidableTypes}
                    look={(avoidable) => avoidLooks[avoidable]}
                    selected={costModel.avoid}
                    onChange={(avoid) => updateCostModel({ avoid })}
                />
            </div>

            <div className="ui-section">
                <h4 className="ui-subheading">Arrival</h4>
                <Field label="Arrive on">
                    <Select
                        options={arrivalSides}
                        optionLabel={(side) => arrivalSideLabels[side]}
                        value={options.arrivalSide ?? 'any'}
                        onChange={(arrivalSide) => update({ arrivalSide })}
                    />
                </Field>
                <Toggle
                    label="Drive to the entrance"
                    checked={options.useEntryPoints === 'main-when-available'}
                    onChange={(checked) => update({ useEntryPoints: checked ? 'main-when-available' : 'ignore' })}
                />
            </div>

            <VehicleSection options={options} onChange={update} />
        </>
    );
};

type Timing = DepartArriveParams['option'] | 'now';

const timingLabels: Record<Timing, string> = { now: 'Leave now', departAt: 'Depart at', arriveBy: 'Arrive by' };

const timings = keysOf(timingLabels);

/** A date as a `datetime-local` value, in the browser's time zone. */
const toLocalInput = (date: Date): string =>
    new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);

const inAnHour = () => new Date(Date.now() + 60 * 60 * 1000);

type TimingFieldProps = { when?: DepartArriveParams; onChange: (when?: DepartArriveParams) => void };

const TimingField = ({ when, onChange }: TimingFieldProps) => (
    <FieldGroup label="When">
        <div className="ui-field-row">
            <Select
                aria-label="Departure or arrival"
                options={timings}
                optionLabel={(timing) => timingLabels[timing]}
                value={when?.option ?? 'now'}
                onChange={(option) =>
                    onChange(option === 'now' ? undefined : { option, date: when?.date ?? inAnHour() })
                }
            />
            {when && (
                <input
                    className="ui-input"
                    type="datetime-local"
                    aria-label={when.option === 'arriveBy' ? 'Arrival time' : 'Departure time'}
                    min={toLocalInput(new Date())}
                    value={toLocalInput(when.date)}
                    onChange={(event) => {
                        if (event.target.value) onChange({ ...when, date: new Date(event.target.value) });
                    }}
                />
            )}
        </div>
    </FieldGroup>
);

const optionalNumber = (value: string): number | undefined => (value === '' ? undefined : Number(value));

type VehicleSectionProps = { options: RouteOptions; onChange: (changes: Partial<RouteOptions>) => void };

const VehicleSection = ({ options, onChange }: VehicleSectionProps) => {
    const vehicle = options.vehicle ?? {};
    const restrictions = vehicle.restrictions ?? {};
    const updateRestrictions = (changes: Partial<typeof restrictions>) =>
        onChange({ vehicle: { ...vehicle, restrictions: { ...restrictions, ...changes } } });
    return (
        <div className="ui-section">
            <h4 className="ui-subheading">Vehicle</h4>
            <div className="ui-field-row">
                <Field label="Weight (kg)">
                    <input
                        className="ui-input"
                        type="number"
                        min={0}
                        max={60000}
                        step={100}
                        placeholder="Any"
                        value={vehicle.model?.dimensions?.weightKG ?? ''}
                        onChange={(event) =>
                            onChange({
                                vehicle: {
                                    ...vehicle,
                                    model: { dimensions: { weightKG: optionalNumber(event.target.value) } },
                                },
                            })
                        }
                    />
                </Field>
                <Field label="Top speed (km/h)">
                    <input
                        className="ui-input"
                        type="number"
                        min={0}
                        max={250}
                        step={10}
                        placeholder="Any"
                        value={restrictions.maxSpeedKMH ?? ''}
                        onChange={(event) => updateRestrictions({ maxSpeedKMH: optionalNumber(event.target.value) })}
                    />
                </Field>
            </div>
            <Field label="Toll transponder">
                <Select
                    options={tollTransponderOptions}
                    optionLabel={(option) => tollTransponderLabels[option]}
                    value={restrictions.tollTransponder ?? 'unknown'}
                    onChange={(tollTransponder) => updateRestrictions({ tollTransponder })}
                />
            </Field>
        </div>
    );
};
